import { Download } from "lucide-react";
import { useEffect } from "react";
import { Link, useParams } from "react-router-dom";
import { Metric } from "../components/Metric";
import { ResultsTable } from "../components/ResultsTable";
import { SectionTitle } from "../components/SectionTitle";
import { buildResultCsv, downloadCsv } from "../lib/csv";
import { useTeacher } from "../teacher/teacherContext";

export function RecapPage() {
  const { id = "" } = useParams();
  const { exams, setSelectedExamId } = useTeacher();
  const exam = exams.find((item) => item.id === id);

  useEffect(() => {
    if (exam) setSelectedExamId(exam.id);
  }, [exam, setSelectedExamId]);

  if (!exam) {
    return (
      <section className="card text-center">
        <h2 className="text-xl font-bold text-ink">Ujian tidak ditemukan</h2>
        <Link className="btn btn-primary mt-4" to="/">
          Kembali ke daftar
        </Link>
      </section>
    );
  }

  const validResults = exam.results.filter((item) => item.status === "valid");

  return (
    <section className="card">
      <div className="mb-4 flex flex-wrap items-start justify-between gap-4">
        <SectionTitle
          description="Unduh rekap hasil dengan kolom minimal MVP."
          title="Rekap Hasil"
        />
        <button
          className="btn btn-secondary"
          disabled={exam.results.length === 0}
          onClick={() =>
            downloadCsv(
              `${exam.id}-hasil.csv`,
              buildResultCsv([...exam.results].reverse()),
            )
          }
          type="button"
        >
          <Download size={16} />
          Export CSV
        </button>
      </div>
      <div className="mb-4 grid gap-3 sm:grid-cols-3">
        <Metric label="Total" value={`${exam.results.length} hasil`} />
        <Metric label="Valid" value={`${validResults.length} hasil`} />
        <Metric
          label="Ditandai"
          value={`${exam.results.length - validResults.length} hasil`}
        />
      </div>
      <ResultsTable examId={exam.id} results={exam.results} />
    </section>
  );
}
