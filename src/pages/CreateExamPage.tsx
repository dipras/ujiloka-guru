import { Plus, Trash2 } from "lucide-react";
import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { SectionTitle } from "../components/SectionTitle";
import { TextField } from "../components/TextField";
import { useTeacher } from "../teacher/teacherContext";

export function CreateExamPage() {
  const {
    addQuestion,
    draft,
    publishDraft,
    removeQuestion,
    setAnswer,
    setDraft,
    updateQuestion,
  } = useTeacher();
  const navigate = useNavigate();
  const [isPublishing, setIsPublishing] = useState(false);
  const answerMap = useMemo(
    () => new Map(draft.ak.map((entry) => [entry.qid, entry.oid])),
    [draft.ak],
  );

  async function handleSubmit() {
    setIsPublishing(true);
    try {
      const exam = await publishDraft();
      navigate(`/exams/${exam.id}`);
    } finally {
      setIsPublishing(false);
    }
  }

  return (
    <section className="flex flex-col gap-5">
        <section className="card">
          <SectionTitle
            description="ID ujian dan kode sesi dibuat otomatis saat QR dibuat."
            title="Metadata Ujian"
          />
          <div className="mt-4 grid gap-4 md:grid-cols-2">
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
        <div className="flex justify-end">
          <button
            className="btn btn-primary"
            disabled={isPublishing}
            onClick={handleSubmit}
            type="button"
          >
            {isPublishing ? "Menyiapkan QR..." : "Buat QR Ujian"}
          </button>
        </div>
    </section>
  );
}
