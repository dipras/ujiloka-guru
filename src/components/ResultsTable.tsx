import { CollectedResult } from "../lib/schema";

type ResultsTableProps = {
  results: CollectedResult[];
};

export function ResultsTable({ results }: ResultsTableProps) {
  return (
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
  );
}
