import { Link } from "react-router-dom";
import { CollectedResult } from "../lib/schema";

type ResultsTableProps = {
  examId?: string;
  results: CollectedResult[];
};

export function ResultsTable({ examId, results }: ResultsTableProps) {
  return (
    <div className="table-wrap">
      <table className="table">
        <thead>
          <tr>
            <th>Nama</th>
            <th>ID/NIS</th>
            <th>Nilai</th>
            <th>Poin</th>
            <th>Benar</th>
            <th>Submit</th>
            <th>Status</th>
            {examId ? <th>Aksi</th> : null}
          </tr>
        </thead>
        <tbody className="divide-y divide-line">
          {results.length === 0 ? (
            <tr>
              <td className="text-muted" colSpan={examId ? 8 : 7}>
                Belum ada hasil siswa.
              </td>
            </tr>
          ) : (
            results.map((item) => (
              <tr key={`${item.result.rid}-${item.result.sub}`}>
                <td>{item.result.stu.name || "-"}</td>
                <td>{item.result.stu.sid || "-"}</td>
                <td>{formatPercentage(item.score)}</td>
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
                {examId ? (
                  <td>
                    <Link
                      className="btn btn-secondary min-h-9 px-3 py-1.5"
                      to={`/exams/${examId}/results/${encodeURIComponent(item.result.rid)}`}
                    >
                      Detail
                    </Link>
                  </td>
                ) : null}
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}

function formatPercentage(score: CollectedResult["score"]) {
  const percentage =
    typeof score.percentage === "number"
      ? score.percentage
      : score.maxScore > 0
        ? (score.score / score.maxScore) * 100
        : 0;
  return `${percentage.toLocaleString("id-ID", {
    maximumFractionDigits: 2,
  })}%`;
}
