import { ClipboardList, Plus, ScanLine } from "lucide-react";
import { Link } from "react-router-dom";
import { SectionTitle } from "../components/SectionTitle";
import { useTeacher } from "../teacher/teacherContext";

type ExamActionSelectPageProps = {
  mode: "collect" | "recap";
};

const actionCopy = {
  collect: {
    title: "Pilih Ujian untuk Kumpulkan Hasil",
    description: "Pilih ujian yang QR hasil siswanya ingin dipindai.",
    icon: ScanLine,
    label: "Kumpulkan",
    path: "collect",
  },
  recap: {
    title: "Pilih Ujian untuk Rekap",
    description: "Pilih ujian yang hasil dan CSV-nya ingin dilihat.",
    icon: ClipboardList,
    label: "Rekap",
    path: "recap",
  },
};

export function ExamActionSelectPage({ mode }: ExamActionSelectPageProps) {
  const { exams, setSelectedExamId, startNewDraft } = useTeacher();
  const copy = actionCopy[mode];
  const Icon = copy.icon;

  return (
    <section className="flex flex-col gap-5">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <SectionTitle description={copy.description} title={copy.title} />
        <Link className="btn btn-primary" onClick={startNewDraft} to="/exams/new">
          <Plus size={16} />
          Tambah Ujian
        </Link>
      </div>

      {exams.length === 0 ? (
        <div className="card grid min-h-[320px] place-items-center text-center">
          <div>
            <h2 className="text-xl font-bold text-ink">Belum ada ujian</h2>
            <p className="mt-2 max-w-md text-sm leading-6 text-muted">
              Buat ujian terlebih dahulu sebelum mengumpulkan hasil atau melihat
              rekap.
            </p>
            <Link
              className="btn btn-primary mt-5"
              onClick={startNewDraft}
              to="/exams/new"
            >
              <Plus size={16} />
              Tambah Ujian
            </Link>
          </div>
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {exams.map((exam) => (
            <Link
              className="card block transition hover:-translate-y-0.5 hover:border-primary"
              key={exam.id}
              onClick={() => setSelectedExamId(exam.id)}
              to={`/${copy.path}/${exam.id}`}
            >
              <div className="flex items-start justify-between gap-3">
                <div>
                  <h2 className="text-lg font-bold text-ink">
                    {exam.payload.ttl || "Tanpa judul"}
                  </h2>
                  <p className="mt-1 text-sm text-muted">
                    {exam.payload.subj || "-"} - {exam.payload.cls || "-"}
                  </p>
                </div>
                <span className="badge">{exam.results.length} hasil</span>
              </div>
              <div className="mt-5 flex items-center gap-2 text-sm font-semibold text-primary">
                <Icon size={16} />
                {copy.label}
              </div>
            </Link>
          ))}
        </div>
      )}
    </section>
  );
}
