import { ResultScanner } from "../components/ResultScanner";
import { ResultsTable } from "../components/ResultsTable";
import { useTeacher } from "../teacher/teacherContext";

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
