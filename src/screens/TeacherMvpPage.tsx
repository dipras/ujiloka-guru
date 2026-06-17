import { Plus, Trash2 } from "lucide-react";
import { useMemo, useState } from "react";
import {
  makeInitialDraft,
  makeQuestion,
  normalizeDraft,
  type ExamDraft,
} from "../lib/factory";

export function TeacherMvpPage() {
  const [draft, setDraft] = useState<ExamDraft>(() => makeInitialDraft());
  const normalized = useMemo(() => normalizeDraft(draft), [draft]);
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
        </aside>
      </section>
    </main>
  );
}
