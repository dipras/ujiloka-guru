import { CollectedResult } from "./schema";

const CSV_HEADERS = [
  "ID ujian",
  "ID hasil",
  "NIS/ID siswa",
  "Nama",
  "Kelas",
  "Kode peserta",
  "Skor objektif",
  "Jumlah soal",
  "Waktu submit",
  "Status",
];

function escapeCsv(value: string | number) {
  const raw = String(value);
  if (!/[",\n\r]/.test(raw)) return raw;
  return `"${raw.replace(/"/g, '""')}"`;
}

export function buildResultCsv(results: CollectedResult[]) {
  const rows = results.map((item) => [
    item.result.eid,
    item.result.rid,
    item.result.stu.sid,
    item.result.stu.name,
    item.result.stu.cls,
    item.result.stu.code,
    item.score.score,
    item.score.totalQuestions,
    item.result.sub,
    item.status,
  ]);

  return [CSV_HEADERS, ...rows]
    .map((row) => row.map((value) => escapeCsv(value)).join(","))
    .join("\n");
}

export function downloadCsv(filename: string, csv: string) {
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = filename;
  anchor.click();
  URL.revokeObjectURL(url);
}
