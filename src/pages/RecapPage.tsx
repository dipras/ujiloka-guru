import { Download } from "lucide-react";
import { Metric } from "../components/Metric";
import { ResultsTable } from "../components/ResultsTable";
import { SectionTitle } from "../components/SectionTitle";
import { buildResultCsv, downloadCsv } from "../lib/csv";
import { useTeacher } from "../teacher/teacherContext";

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
