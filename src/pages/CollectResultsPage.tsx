import { useEffect } from "react";
import { Link, useParams } from "react-router-dom";
import { ResultScanner } from "../components/ResultScanner";
import { ResultsTable } from "../components/ResultsTable";
import { SectionTitle } from "../components/SectionTitle";
import { useTeacher } from "../teacher/teacherContext";

export function CollectResultsPage() {
  const { id = "" } = useParams();
  const {
    collectorMessage,
    exams,
    manualResult,
    processResultQr,
    setManualResult,
    setSelectedExamId,
  } = useTeacher();
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

  return (
    <section className="flex flex-col gap-5">
      <div className="card">
        <SectionTitle
          description={`${exam.payload.subj || "-"} - ${exam.payload.cls || "-"}`}
          title={`Kumpulkan Hasil: ${exam.payload.ttl || "Ujian"}`}
        />
      </div>

      <div className="grid gap-5 lg:grid-cols-[380px_minmax(0,1fr)]">
        <div className="flex flex-col gap-4">
          <ResultScanner onScan={(value) => processResultQr(exam.id, value)} />
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
                processResultQr(exam.id, manualResult);
                setManualResult("");
              }}
              type="button"
            >
              Proses Payload
            </button>
            {collectorMessage ? (
              <div className="toast mt-3">{collectorMessage}</div>
            ) : null}
          </div>
        </div>
        <ResultsTable results={exam.results} />
      </div>
    </section>
  );
}
