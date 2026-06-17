import { Clock, Plus, QrCode, Users } from "lucide-react";
import type { ReactNode } from "react";
import { Link } from "react-router-dom";
import { SectionTitle } from "../components/SectionTitle";
import { useTeacher } from "../teacher/teacherContext";

export function ExamListPage() {
  const { exams, setSelectedExamId, startNewDraft } = useTeacher();

  return (
    <section className="flex flex-col gap-5">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <SectionTitle
          description="Pilih ujian yang sudah dibuat atau buat paket ujian baru."
          title="Daftar Ujian"
        />
        <Link className="btn btn-primary" onClick={startNewDraft} to="/exams/new">
          <Plus size={16} />
          Tambah Ujian
        </Link>
      </div>

      {exams.length === 0 ? (
        <div className="card grid min-h-[360px] place-items-center text-center">
          <div>
            <h2 className="text-xl font-bold text-ink">Belum ada ujian</h2>
            <p className="mt-2 max-w-md text-sm leading-6 text-muted">
              Buat ujian pertama, submit, lalu QR akan dipersiapkan untuk
              distribusi offline.
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
          {exams.map((exam) => {
            const validCount = exam.results.filter(
              (item) => item.status === "valid",
            ).length;

            return (
              <Link
                className="card block transition hover:-translate-y-0.5 hover:border-primary"
                key={exam.id}
                onClick={() => setSelectedExamId(exam.id)}
                to={`/exams/${exam.id}`}
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
                  <span className="badge">{exam.payload.qs.length} soal</span>
                </div>
                <div className="mt-5 grid grid-cols-3 gap-3 text-sm">
                  <Info icon={<QrCode size={15} />} label={`${exam.chunks.length} QR`} />
                  <Info
                    icon={<Users size={15} />}
                    label={`${validCount}/${exam.results.length} hasil`}
                  />
                  <Info
                    icon={<Clock size={15} />}
                    label={new Date(exam.createdAt).toLocaleDateString("id-ID")}
                  />
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </section>
  );
}

function Info({ icon, label }: { icon: ReactNode; label: string }) {
  return (
    <div className="flex min-w-0 items-center gap-1.5 text-muted">
      {icon}
      <span className="truncate">{label}</span>
    </div>
  );
}
