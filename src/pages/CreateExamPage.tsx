import { Plus, Trash2 } from "lucide-react";
import { SectionTitle } from "../components/SectionTitle";
import { SummaryItem } from "../components/SummaryItem";
import { TextField } from "../components/TextField";
import { useTeacher } from "../teacher/teacherContext";

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
