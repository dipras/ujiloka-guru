import { ClipboardList, FileQuestion, Home, QrCode, ScanLine } from "lucide-react";
import { NavLink, Outlet } from "react-router-dom";
import { Metric } from "../components/Metric";
import { TeacherContext } from "../teacher/teacherContext";
import { useTeacherState } from "../teacher/useTeacherState";

const navigation = [
  { to: "/", label: "Buat Ujian", icon: FileQuestion, end: true },
  { to: "/qr", label: "QR Distribusi", icon: QrCode },
  { to: "/collect", label: "Kumpulkan", icon: ScanLine },
  { to: "/recap", label: "Rekap", icon: ClipboardList },
];

export function TeacherAppLayout() {
  const state = useTeacherState();

  return (
    <div className="min-h-screen bg-canvas">
      <header className="sticky top-0 z-20 border-b border-line bg-white/95 backdrop-blur no-print">
        <div className="mx-auto flex max-w-7xl flex-col gap-4 px-5 py-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <div className="flex items-center gap-2 text-sm font-bold text-primary">
              <Home size={16} />
              LIDM Teacher Web
            </div>
            <h1 className="mt-1 text-2xl font-bold text-ink">
              Paket Ujian Offline QR
            </h1>
          </div>
          <nav className="flex gap-2 overflow-x-auto">
            {navigation.map((item) => (
              <NavLink
                className={({ isActive }) =>
                  [
                    "inline-flex min-h-10 shrink-0 items-center gap-2 rounded-md px-3 py-2 text-sm font-semibold transition",
                    isActive
                      ? "bg-primary text-white"
                      : "text-muted hover:bg-slate-100 hover:text-ink",
                  ].join(" ")
                }
                end={item.end}
                key={item.to}
                to={item.to}
              >
                <item.icon size={16} />
                {item.label}
              </NavLink>
            ))}
          </nav>
        </div>
      </header>

      <main className="mx-auto flex max-w-7xl flex-col gap-6 px-5 py-6">
        <StatusStrip state={state} />
        <Outlet context={state} />
      </main>

      <footer className="border-t border-line bg-white no-print">
        <div className="mx-auto flex max-w-7xl flex-col gap-2 px-5 py-5 text-sm text-muted md:flex-row md:items-center md:justify-between">
          <span>Alur MVP: Generate QR, Scan Hasil, Scoring, CSV.</span>
          <span>
            Exam ID: <strong className="text-ink">{state.normalized.eid}</strong>
          </span>
        </div>
      </footer>
    </div>
  );
}

function StatusStrip({ state }: { state: TeacherContext }) {
  const { examChunks, examJson, normalized, results, validResults } = state;

  return (
    <section className="grid gap-3 no-print sm:grid-cols-2 lg:grid-cols-4">
      <Metric label="Judul" value={normalized.ttl || "Belum diisi"} />
      <Metric label="Soal" value={`${normalized.qs.length} soal`} />
      <Metric label="QR" value={`${examChunks.length} chunk`} />
      <Metric
        detail={`${examJson.length.toLocaleString("id-ID")} karakter`}
        label="Hasil"
        value={`${validResults.length}/${results.length} valid`}
      />
    </section>
  );
}
