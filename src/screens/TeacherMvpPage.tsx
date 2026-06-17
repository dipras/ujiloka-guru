import { Download, Printer, Plus, QrCode, ScanLine, Trash2 } from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";
import {
  makeInitialDraft,
  makeQuestion,
  normalizeDraft,
  type ExamDraft,
} from "../lib/factory";
import {
  chunkString,
  decodeJson,
  encodeJson,
  isQrChunk,
  isResultPayload,
  reconstructChunks,
  stringifyChunk,
} from "../lib/codec";
import { buildExamPayload } from "../lib/exam";
import { QrImage } from "../components/QrImage";
import { ResultScanner } from "../components/ResultScanner";
import { scoreObjectiveResult } from "../lib/scoring";
import { CollectedResult, QrChunk, ResultPayload } from "../lib/schema";

export function TeacherMvpPage() {
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
  const answerMap = useMemo(
    () => new Map(draft.ak.map((entry) => [entry.qid, entry.oid])),
    [draft.ak],
  );

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

  return (
    <main className="mx-auto flex min-h-screen max-w-7xl flex-col gap-6 px-5 py-8">
      <header className="no-print">
        <p className="text-sm font-semibold uppercase tracking-wide text-primary">
          LIDM Teacher Web
        </p>
        <h1 className="mt-2 text-3xl font-bold text-ink">
          Paket Ujian Offline QR
        </h1>
        <p className="mt-2 max-w-2xl text-sm leading-6 text-muted">
          Buat ujian objektif, kirim lewat QR multi-chunk, kumpulkan QR hasil,
          hitung skor di web, lalu ekspor CSV.
        </p>
      </header>

      <section className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_360px]">
        <div className="flex flex-col gap-5">
          <section className="card no-print">
            <div className="mb-4 flex items-start justify-between gap-4">
              <div>
                <h2 className="text-lg font-bold text-ink">Metadata Ujian</h2>
                <p className="mt-1 text-sm text-muted">
                  Kode sesi dipakai siswa untuk membuka ujian setelah scan QR.
                </p>
              </div>
              <span className="badge">{normalized.qs.length} soal</span>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <label>
                <span className="label">ID ujian</span>
                <input
                  className="field"
                  value={draft.eid}
                  onChange={(event) =>
                    setDraft((current) => ({
                      ...current,
                      eid: event.target.value,
                    }))
                  }
                />
              </label>
              <label>
                <span className="label">Judul</span>
                <input
                  className="field"
                  value={draft.ttl}
                  onChange={(event) =>
                    setDraft((current) => ({
                      ...current,
                      ttl: event.target.value,
                    }))
                  }
                />
              </label>
              <label>
                <span className="label">Mata pelajaran</span>
                <input
                  className="field"
                  value={draft.subj}
                  onChange={(event) =>
                    setDraft((current) => ({
                      ...current,
                      subj: event.target.value,
                    }))
                  }
                />
              </label>
              <label>
                <span className="label">Kelas</span>
                <input
                  className="field"
                  value={draft.cls}
                  onChange={(event) =>
                    setDraft((current) => ({
                      ...current,
                      cls: event.target.value,
                    }))
                  }
                />
              </label>
              <label>
                <span className="label">Durasi menit</span>
                <input
                  className="field"
                  type="number"
                  min={1}
                  value={draft.dur}
                  onChange={(event) =>
                    setDraft((current) => ({
                      ...current,
                      dur: Number(event.target.value),
                    }))
                  }
                />
              </label>
              <label>
                <span className="label">Kode sesi</span>
                <input
                  className="field"
                  value={draft.sch}
                  onChange={(event) =>
                    setDraft((current) => ({
                      ...current,
                      sch: event.target.value,
                    }))
                  }
                />
              </label>
            </div>
          </section>

          <section className="card no-print">
            <div className="mb-4 flex items-center justify-between gap-3">
              <div>
                <h2 className="text-lg font-bold text-ink">Editor Soal</h2>
                <p className="mt-1 text-sm text-muted">
                  Jawaban benar memakai ID opsi, misalnya `o1`, bukan huruf.
                </p>
              </div>
              <button className="btn btn-primary" type="button" onClick={addQuestion}>
                <Plus size={16} />
                Soal
              </button>
            </div>

            <div className="flex flex-col gap-4">
              {draft.qs.map((question, index) => (
                <article className="rounded-lg border border-line p-4" key={question.id}>
                  <div className="mb-3 flex items-start justify-between gap-3">
                    <div>
                      <h3 className="font-bold text-ink">Soal {index + 1}</h3>
                      <p className="text-xs text-muted">ID: {question.id}</p>
                    </div>
                    <button
                      className="btn btn-ghost min-h-9 px-2"
                      type="button"
                      onClick={() => removeQuestion(question.id)}
                      disabled={draft.qs.length === 1}
                      title="Hapus soal"
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
                        type="number"
                        min={0}
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

        <aside className="card h-fit no-print">
          <h2 className="text-lg font-bold text-ink">Ringkasan Draft</h2>
          <dl className="mt-4 grid grid-cols-2 gap-3 text-sm">
            <div>
              <dt className="text-muted">Ujian</dt>
              <dd className="font-semibold text-ink">{normalized.ttl || "-"}</dd>
            </div>
            <div>
              <dt className="text-muted">Durasi</dt>
              <dd className="font-semibold text-ink">{normalized.dur} menit</dd>
            </div>
            <div>
              <dt className="text-muted">Mapel</dt>
              <dd className="font-semibold text-ink">{normalized.subj || "-"}</dd>
            </div>
            <div>
              <dt className="text-muted">Kelas</dt>
              <dd className="font-semibold text-ink">{normalized.cls || "-"}</dd>
            </div>
          </dl>
          <div className="mt-4 rounded-md border border-line bg-slate-50 p-3">
            <p className="text-xs font-semibold uppercase tracking-wide text-muted">
              Payload
            </p>
            <p className="mt-1 text-sm font-semibold text-ink">
              {examJson.length.toLocaleString("id-ID")} karakter
            </p>
            <p className="mt-2 break-all text-xs leading-5 text-muted">
              `ak`: {examPayload.ak.slice(0, 48)}
              {examPayload.ak.length > 48 ? "..." : ""}
            </p>
          </div>
        </aside>
      </section>

      <section className="card">
        <div className="mb-4 flex flex-wrap items-start justify-between gap-4">
          <div>
            <h2 className="flex items-center gap-2 text-lg font-bold text-ink">
              <QrCode size={20} />
              QR Ujian Multi-Chunk
            </h2>
            <p className="mt-1 text-sm text-muted">
              Siswa dapat memindai chunk dalam urutan bebas. Nilai `v` tiap
              chunk dijaga maksimal 500 karakter.
            </p>
          </div>
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
                type="range"
                min={800}
                max={5000}
                step={100}
                value={slideSpeed}
                onChange={(event) => setSlideSpeed(Number(event.target.value))}
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

      <section className="card no-print">
        <div className="mb-4 flex flex-wrap items-start justify-between gap-4">
          <div>
            <h2 className="flex items-center gap-2 text-lg font-bold text-ink">
              <ScanLine size={20} />
              Collector Hasil
            </h2>
            <p className="mt-1 text-sm text-muted">
              Skor objektif dihitung di web dari kunci paket aktif. Skor dari
              perangkat siswa tidak dipakai.
            </p>
          </div>
          <span className="badge">{results.length} hasil</span>
        </div>

        <div className="grid gap-4 lg:grid-cols-[360px_minmax(0,1fr)]">
          <div className="flex flex-col gap-4">
            <ResultScanner onScan={processResultQr} />
            <div className="rounded-lg border border-line p-4">
              <label>
                <span className="label">Paste payload QR hasil</span>
                <textarea
                  className="field"
                  value={manualResult}
                  onChange={(event) => setManualResult(event.target.value)}
                  placeholder='{"t":"result",...} atau {"i":"result-id",...}'
                />
              </label>
              <button
                className="btn btn-primary mt-3 w-full"
                type="button"
                onClick={() => {
                  processResultQr(manualResult);
                  setManualResult("");
                }}
              >
                Proses Payload
              </button>
              {collectorMessage ? (
                <div className="toast mt-3">{collectorMessage}</div>
              ) : null}
            </div>
          </div>

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
        </div>
      </section>
    </main>
  );
}
