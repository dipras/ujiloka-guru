import {
  ClipboardList,
  Download,
  FileQuestion,
  Home,
  Printer,
  Plus,
  QrCode,
  ScanLine,
  Trash2,
} from "lucide-react";
import type { ReactNode } from "react";
import { useCallback, useEffect, useMemo, useState } from "react";
import { NavLink, Outlet, useOutletContext } from "react-router-dom";
import { QrImage } from "../components/QrImage";
import { ResultScanner } from "../components/ResultScanner";
import {
  chunkString,
  decodeJson,
  encodeJson,
  isQrChunk,
  isResultPayload,
  reconstructChunks,
  stringifyChunk,
} from "../lib/codec";
import { buildResultCsv, downloadCsv } from "../lib/csv";
import { buildExamPayload } from "../lib/exam";
import {
  makeInitialDraft,
  makeQuestion,
  normalizeDraft,
  type ExamDraft,
} from "../lib/factory";
import { scoreObjectiveResult } from "../lib/scoring";
import { CollectedResult, QrChunk, ResultPayload } from "../lib/schema";

type TeacherContext = ReturnType<typeof useTeacherState>;

const navigation = [
  { to: "/", label: "Buat Ujian", icon: FileQuestion, end: true },
  { to: "/qr", label: "QR Distribusi", icon: QrCode },
  { to: "/collect", label: "Kumpulkan", icon: ScanLine },
  { to: "/recap", label: "Rekap", icon: ClipboardList },
];

function useTeacher() {
  return useOutletContext<TeacherContext>();
}

function useTeacherState() {
  const [draft, setDraft] = useState<ExamDraft>(() => makeInitialDraft());
  const [slideIndex, setSlideIndex] = useState(0);
  const [slideSpeed, setSlideSpeed] = useState(1800);
  const [manualResult, setManualResult] = useState("");
  const [collectorMessage, setCollectorMessage] = useState("");
  const [resultChunks, setResultChunks] = useState<Record<string, QrChunk[]>>({});
  const [results, setResults] = useState<CollectedResult[]>([]);

  const normalized = useMemo(() => normalizeDraft(draft), [draft]);
  const examPayload = useMemo(() => buildExamPayload(draft), [draft]);
  const examJson = useMemo(() => encodeJson(examPayload), [examPayload]);
  const examChunks = useMemo(
    () => chunkString(examPayload.eid, examJson),
    [examJson, examPayload.eid],
  );
  const examChunkValues = useMemo(
    () => examChunks.map((chunk) => stringifyChunk(chunk)),
    [examChunks],
  );
  const answerMap = useMemo(
    () => new Map(draft.ak.map((entry) => [entry.qid, entry.oid])),
    [draft.ak],
  );
  const validResults = results.filter((item) => item.status === "valid");

  useEffect(() => {
    if (examChunkValues.length <= 1) return;
    const timer = window.setInterval(() => {
      setSlideIndex((current) => (current + 1) % examChunkValues.length);
    }, slideSpeed);
    return () => window.clearInterval(timer);
  }, [examChunkValues.length, slideSpeed]);

  useEffect(() => {
    setSlideIndex(0);
  }, [examPayload.eid, examChunkValues.length]);

  function updateQuestion(
    qid: string,
    updater: (question: ExamDraft["qs"][number]) => ExamDraft["qs"][number],
  ) {
    setDraft((current) => ({
      ...current,
      qs: current.qs.map((question) =>
        question.id === qid ? updater(question) : question,
      ),
    }));
  }

  function setAnswer(qid: string, oid: string) {
    setDraft((current) => ({
      ...current,
      ak: current.ak.some((entry) => entry.qid === qid)
        ? current.ak.map((entry) =>
            entry.qid === qid ? { ...entry, oid } : entry,
          )
        : [...current.ak, { qid, oid }],
    }));
  }

  function addQuestion() {
    setDraft((current) => {
      const question = makeQuestion(current.qs.length + 1);
      return {
        ...current,
        qs: [...current.qs, question],
        ak: [...current.ak, { qid: question.id, oid: question.opts[0].id }],
      };
    });
  }

  function removeQuestion(qid: string) {
    setDraft((current) => {
      if (current.qs.length === 1) return current;
      return {
        ...current,
        qs: current.qs.filter((question) => question.id !== qid),
        ak: current.ak.filter((entry) => entry.qid !== qid),
      };
    });
  }

  const collectResult = useCallback(
    (result: ResultPayload) => {
      const duplicate = results.some(
        (item) =>
          item.result.rid === result.rid ||
          item.result.stu.sid === result.stu.sid ||
          item.result.stu.code === result.stu.code,
      );
      const status =
        result.eid !== normalized.eid
          ? "exam-mismatch"
          : duplicate
            ? "duplicate"
            : "valid";
      const score = scoreObjectiveResult(normalized.qs, normalized.ak, result);
      setResults((current) => [{ result, score, status }, ...current]);
      setCollectorMessage(
        status === "valid"
          ? `Hasil ${result.stu.name || result.stu.sid} tersimpan.`
          : status === "duplicate"
            ? "Hasil terdeteksi duplikat dan tetap ditandai di tabel."
            : "ID ujian hasil tidak cocok dengan paket aktif.",
      );
    },
    [normalized.ak, normalized.eid, normalized.qs, results],
  );

  const processResultQr = useCallback(
    (value: string) => {
      try {
        const parsed = decodeJson<unknown>(value.trim());
        if (isResultPayload(parsed)) {
          collectResult(parsed);
          return;
        }

        if (isQrChunk(parsed)) {
          const existing = resultChunks[parsed.i] || [];
          const withoutDuplicate = existing.filter((chunk) => chunk.n !== parsed.n);
          const nextChunks = [...withoutDuplicate, parsed].sort((a, b) => a.n - b.n);
          setResultChunks((current) => ({
            ...current,
            [parsed.i]: nextChunks,
          }));

          if (nextChunks.length === parsed.t) {
            const reconstructed = reconstructChunks(nextChunks);
            const result = decodeJson<unknown>(reconstructed);
            if (!isResultPayload(result)) {
              throw new Error("Chunk lengkap, tetapi payload bukan hasil.");
            }
            collectResult(result);
          } else {
            setCollectorMessage(
              `Chunk hasil ${parsed.i}: ${nextChunks.length}/${parsed.t}`,
            );
          }
          return;
        }

        throw new Error("QR bukan payload hasil atau chunk MVP.");
      } catch (error) {
        setCollectorMessage(
          error instanceof Error ? error.message : "Payload hasil tidak valid.",
        );
      }
    },
    [collectResult, resultChunks],
  );

  return {
    addQuestion,
    answerMap,
    collectorMessage,
    draft,
    examChunkValues,
    examChunks,
    examJson,
    examPayload,
    manualResult,
    normalized,
    processResultQr,
    removeQuestion,
    results,
    setAnswer,
    setDraft,
    setManualResult,
    setSlideSpeed,
    slideIndex,
    slideSpeed,
    updateQuestion,
    validResults,
  };
}

export function TeacherAppLayout() {
  const state = useTeacherState();

  return (
    <div className="min-h-screen bg-canvas">
      <header className="sticky top-0 z-20 border-b border-line bg-white/95 backdrop-blur no-print">
        <div className="mx-auto flex max-w-7xl flex-col gap-4 px-5 py-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <div className="flex items-center gap-2 text-sm font-bold text-primary">
              <Home size={16} />
              LIDM Teacher Web
            </div>
            <h1 className="mt-1 text-2xl font-bold text-ink">
              Paket Ujian Offline QR
            </h1>
          </div>
          <nav className="flex gap-2 overflow-x-auto">
            {navigation.map((item) => (
              <NavLink
                className={({ isActive }) =>
                  [
                    "inline-flex min-h-10 shrink-0 items-center gap-2 rounded-md px-3 py-2 text-sm font-semibold transition",
                    isActive
                      ? "bg-primary text-white"
                      : "text-muted hover:bg-slate-100 hover:text-ink",
                  ].join(" ")
                }
                end={item.end}
                key={item.to}
                to={item.to}
              >
                <item.icon size={16} />
                {item.label}
              </NavLink>
            ))}
          </nav>
        </div>
      </header>

      <main className="mx-auto flex max-w-7xl flex-col gap-6 px-5 py-6">
        <StatusStrip state={state} />
        <Outlet context={state} />
      </main>

      <footer className="border-t border-line bg-white no-print">
        <div className="mx-auto flex max-w-7xl flex-col gap-2 px-5 py-5 text-sm text-muted md:flex-row md:items-center md:justify-between">
          <span>Alur MVP: Generate QR, Scan Hasil, Scoring, CSV.</span>
          <span>
            Exam ID: <strong className="text-ink">{state.normalized.eid}</strong>
          </span>
        </div>
      </footer>
    </div>
  );
}

function StatusStrip({ state }: { state: TeacherContext }) {
  const { examChunks, examJson, normalized, results, validResults } = state;

  return (
    <section className="grid gap-3 no-print sm:grid-cols-2 lg:grid-cols-4">
      <Metric label="Judul" value={normalized.ttl || "Belum diisi"} />
      <Metric label="Soal" value={`${normalized.qs.length} soal`} />
      <Metric label="QR" value={`${examChunks.length} chunk`} />
      <Metric
        label="Hasil"
        value={`${validResults.length}/${results.length} valid`}
        detail={`${examJson.length.toLocaleString("id-ID")} karakter`}
      />
    </section>
  );
}

function Metric({
  detail,
  label,
  value,
}: {
  detail?: string;
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-lg border border-line bg-white px-4 py-3 shadow-soft">
      <p className="text-xs font-bold uppercase tracking-wide text-muted">{label}</p>
      <p className="mt-1 truncate text-base font-bold text-ink">{value}</p>
      {detail ? <p className="mt-1 text-xs text-muted">{detail}</p> : null}
    </div>
  );
}

export function CreateExamPage() {
  const {
    addQuestion,
    answerMap,
    draft,
    examJson,
    examPayload,
    normalized,
    removeQuestion,
    setAnswer,
    setDraft,
    updateQuestion,
  } = useTeacher();

  return (
    <section className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_340px]">
      <div className="flex flex-col gap-5">
        <section className="card">
          <SectionTitle
            description="Kode sesi dipakai siswa untuk membuka ujian setelah scan QR."
            title="Metadata Ujian"
          />
          <div className="mt-4 grid gap-4 md:grid-cols-2">
            <TextField
              label="ID ujian"
              value={draft.eid}
              onChange={(eid) => setDraft((current) => ({ ...current, eid }))}
            />
            <TextField
              label="Judul"
              value={draft.ttl}
              onChange={(ttl) => setDraft((current) => ({ ...current, ttl }))}
            />
            <TextField
              label="Mata pelajaran"
              value={draft.subj}
              onChange={(subj) => setDraft((current) => ({ ...current, subj }))}
            />
            <TextField
              label="Kelas"
              value={draft.cls}
              onChange={(cls) => setDraft((current) => ({ ...current, cls }))}
            />
            <label>
              <span className="label">Durasi menit</span>
              <input
                className="field"
                min={1}
                type="number"
                value={draft.dur}
                onChange={(event) =>
                  setDraft((current) => ({
                    ...current,
                    dur: Number(event.target.value),
                  }))
                }
              />
            </label>
            <TextField
              label="Kode sesi"
              value={draft.sch}
              onChange={(sch) => setDraft((current) => ({ ...current, sch }))}
            />
          </div>
        </section>

        <section className="card">
          <div className="flex items-center justify-between gap-3">
            <SectionTitle
              description="Jawaban benar memakai ID opsi, misalnya o1, bukan huruf."
              title="Editor Soal"
            />
            <button className="btn btn-primary" type="button" onClick={addQuestion}>
              <Plus size={16} />
              Soal
            </button>
          </div>

          <div className="mt-4 flex flex-col gap-4">
            {draft.qs.map((question, index) => (
              <article
                className="rounded-lg border border-line bg-white p-4"
                key={question.id}
              >
                <div className="mb-3 flex items-start justify-between gap-3">
                  <div>
                    <h3 className="font-bold text-ink">Soal {index + 1}</h3>
                    <p className="text-xs text-muted">ID: {question.id}</p>
                  </div>
                  <button
                    className="btn btn-ghost min-h-9 px-2"
                    disabled={draft.qs.length === 1}
                    onClick={() => removeQuestion(question.id)}
                    title="Hapus soal"
                    type="button"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>

                <div className="grid gap-3 md:grid-cols-[1fr_120px]">
                  <label>
                    <span className="label">Pertanyaan</span>
                    <textarea
                      className="field"
                      value={question.txt}
                      onChange={(event) =>
                        updateQuestion(question.id, (item) => ({
                          ...item,
                          txt: event.target.value,
                        }))
                      }
                    />
                  </label>
                  <label>
                    <span className="label">Poin</span>
                    <input
                      className="field"
                      min={0}
                      type="number"
                      value={question.pts}
                      onChange={(event) =>
                        updateQuestion(question.id, (item) => ({
                          ...item,
                          pts: Number(event.target.value),
                        }))
                      }
                    />
                  </label>
                </div>

                <div className="mt-3 grid gap-3 md:grid-cols-2">
                  {question.opts.map((option) => (
                    <label key={option.id}>
                      <span className="label">Opsi {option.id}</span>
                      <input
                        className="field"
                        value={option.txt}
                        onChange={(event) =>
                          updateQuestion(question.id, (item) => ({
                            ...item,
                            opts: item.opts.map((currentOption) =>
                              currentOption.id === option.id
                                ? { ...currentOption, txt: event.target.value }
                                : currentOption,
                            ),
                          }))
                        }
                      />
                    </label>
                  ))}
                </div>

                <label className="mt-3 block">
                  <span className="label">Jawaban benar</span>
                  <select
                    className="field"
                    value={answerMap.get(question.id) || question.opts[0]?.id}
                    onChange={(event) => setAnswer(question.id, event.target.value)}
                  >
                    {question.opts.map((option) => (
                      <option key={option.id} value={option.id}>
                        {option.id}
                      </option>
                    ))}
                  </select>
                </label>
              </article>
            ))}
          </div>
        </section>
      </div>

      <aside className="card h-fit">
        <SectionTitle title="Ringkasan Draft" />
        <dl className="mt-4 grid grid-cols-2 gap-3 text-sm">
          <SummaryItem label="Ujian" value={normalized.ttl || "-"} />
          <SummaryItem label="Durasi" value={`${normalized.dur} menit`} />
          <SummaryItem label="Mapel" value={normalized.subj || "-"} />
          <SummaryItem label="Kelas" value={normalized.cls || "-"} />
        </dl>
        <div className="mt-4 rounded-md border border-line bg-slate-50 p-3">
          <p className="text-xs font-semibold uppercase tracking-wide text-muted">
            Payload
          </p>
          <p className="mt-1 text-sm font-semibold text-ink">
            {examJson.length.toLocaleString("id-ID")} karakter
          </p>
          <p className="mt-2 break-all text-xs leading-5 text-muted">
            ak: {examPayload.ak.slice(0, 48)}
            {examPayload.ak.length > 48 ? "..." : ""}
          </p>
        </div>
      </aside>
    </section>
  );
}

export function DistributeQrPage() {
  const {
    examChunkValues,
    examChunks,
    examJson,
    examPayload,
    setSlideSpeed,
    slideIndex,
    slideSpeed,
  } = useTeacher();

  return (
    <section className="card">
      <div className="mb-4 flex flex-wrap items-start justify-between gap-4">
        <SectionTitle
          description="Siswa dapat memindai chunk dalam urutan bebas. Nilai v tiap chunk maksimal 500 karakter."
          icon={<QrCode size={20} />}
          title="QR Ujian Multi-Chunk"
        />
        <div className="flex flex-wrap gap-2 no-print">
          <span className="badge">
            Payload {examJson.length.toLocaleString("id-ID")} karakter
          </span>
          <span className="badge">{examChunks.length} QR</span>
          <button
            className="btn btn-secondary"
            type="button"
            onClick={() => window.print()}
          >
            <Printer size={16} />
            Cetak
          </button>
        </div>
      </div>

      <div className="mb-5 grid gap-4 lg:grid-cols-[minmax(0,1fr)_340px] no-print">
        <div className="grid place-items-center rounded-lg border border-line bg-slate-50 p-6">
          <QrImage
            key={`slide-${examPayload.eid}-${slideIndex}`}
            label={`${slideIndex + 1}/${examChunks.length} - slideshow`}
            size={300}
            value={examChunkValues[slideIndex]}
          />
        </div>
        <div className="rounded-lg border border-line p-4">
          <h3 className="font-bold text-ink">Slideshow Looping</h3>
          <p className="mt-1 text-sm leading-6 text-muted">
            Tampilkan panel ini di proyektor agar siswa dapat memindai chunk
            satu per satu.
          </p>
          <label className="mt-4 block">
            <span className="label">Speed per QR: {slideSpeed} ms</span>
            <input
              className="w-full accent-primary"
              max={5000}
              min={800}
              onChange={(event) => setSlideSpeed(Number(event.target.value))}
              step={100}
              type="range"
              value={slideSpeed}
            />
          </label>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {examChunkValues.map((value, index) => (
          <div className="print-page" key={`${examPayload.eid}-${index}`}>
            <QrImage
              label={`${index + 1}/${examChunks.length} - ${examChunks[index].v.length} char`}
              value={value}
            />
          </div>
        ))}
      </div>
    </section>
  );
}

export function CollectResultsPage() {
  const {
    collectorMessage,
    manualResult,
    processResultQr,
    results,
    setManualResult,
  } = useTeacher();

  return (
    <section className="grid gap-5 lg:grid-cols-[380px_minmax(0,1fr)]">
      <div className="flex flex-col gap-4">
        <ResultScanner onScan={processResultQr} />
        <div className="card">
          <label>
            <span className="label">Paste payload QR hasil</span>
            <textarea
              className="field"
              onChange={(event) => setManualResult(event.target.value)}
              placeholder='{"t":"result",...} atau {"i":"result-id",...}'
              value={manualResult}
            />
          </label>
          <button
            className="btn btn-primary mt-3 w-full"
            onClick={() => {
              processResultQr(manualResult);
              setManualResult("");
            }}
            type="button"
          >
            Proses Payload
          </button>
          {collectorMessage ? <div className="toast mt-3">{collectorMessage}</div> : null}
        </div>
      </div>
      <ResultsTable results={results} />
    </section>
  );
}

export function RecapPage() {
  const { normalized, results, validResults } = useTeacher();

  return (
    <section className="card">
      <div className="mb-4 flex flex-wrap items-start justify-between gap-4">
        <SectionTitle
          description="Unduh rekap hasil dengan kolom minimal MVP."
          title="Rekap Hasil"
        />
        <button
          className="btn btn-secondary"
          disabled={results.length === 0}
          onClick={() =>
            downloadCsv(
              `${normalized.eid}-hasil.csv`,
              buildResultCsv([...results].reverse()),
            )
          }
          type="button"
        >
          <Download size={16} />
          Export CSV
        </button>
      </div>
      <div className="mb-4 grid gap-3 sm:grid-cols-3">
        <Metric label="Total" value={`${results.length} hasil`} />
        <Metric label="Valid" value={`${validResults.length} hasil`} />
        <Metric
          label="Ditandai"
          value={`${results.length - validResults.length} hasil`}
        />
      </div>
      <ResultsTable results={results} />
    </section>
  );
}

function ResultsTable({ results }: { results: CollectedResult[] }) {
  return (
    <div className="table-wrap">
      <table className="table">
        <thead>
          <tr>
            <th>Nama</th>
            <th>ID/NIS</th>
            <th>Skor</th>
            <th>Benar</th>
            <th>Submit</th>
            <th>Status</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-line">
          {results.length === 0 ? (
            <tr>
              <td className="text-muted" colSpan={6}>
                Belum ada hasil siswa.
              </td>
            </tr>
          ) : (
            results.map((item) => (
              <tr key={`${item.result.rid}-${item.result.sub}`}>
                <td>{item.result.stu.name || "-"}</td>
                <td>{item.result.stu.sid || "-"}</td>
                <td>
                  {item.score.score}/{item.score.maxScore}
                </td>
                <td>
                  {item.score.correct}/{item.score.totalQuestions}
                </td>
                <td>{new Date(item.result.sub).toLocaleString("id-ID")}</td>
                <td>
                  <span className="badge">{item.status}</span>
                </td>
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}

function SectionTitle({
  description,
  icon,
  title,
}: {
  description?: string;
  icon?: ReactNode;
  title: string;
}) {
  return (
    <div>
      <h2 className="flex items-center gap-2 text-lg font-bold text-ink">
        {icon}
        {title}
      </h2>
      {description ? <p className="mt-1 text-sm text-muted">{description}</p> : null}
    </div>
  );
}

function TextField({
  label,
  onChange,
  value,
}: {
  label: string;
  onChange: (value: string) => void;
  value: string;
}) {
  return (
    <label>
      <span className="label">{label}</span>
      <input
        className="field"
        onChange={(event) => onChange(event.target.value)}
        value={value}
      />
    </label>
  );
}

function SummaryItem({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="text-muted">{label}</dt>
      <dd className="font-semibold text-ink">{value}</dd>
    </div>
  );
}
