import { ClipboardList, FileQuestion, Home, ScanLine } from "lucide-react";
import { NavLink, Outlet } from "react-router-dom";
import { useTeacherState } from "../teacher/useTeacherState";

export function TeacherAppLayout() {
  const state = useTeacherState();
  const navigation = [
    { to: "/", label: "Ujian", icon: FileQuestion, end: true },
    {
      to: "/collect",
      label: "Kumpulkan",
      icon: ScanLine,
      end: false,
    },
    {
      to: "/recap",
      label: "Rekap",
      icon: ClipboardList,
      end: false,
    },
  ];

  return (
    <div className="flex min-h-screen flex-col bg-canvas">
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

      <main className="mx-auto flex w-full max-w-7xl flex-1 flex-col gap-6 px-5 py-6">
        <Outlet context={state} />
      </main>

      <footer className="border-t border-line bg-white no-print">
        <div className="mx-auto flex max-w-7xl flex-col gap-3 px-5 py-5 text-sm text-muted md:flex-row md:items-center md:justify-between">
          <p className="max-w-3xl leading-6">
            LIDM Teacher Web membantu guru membuat paket ujian offline,
            membagikan soal lewat QR multi-chunk, mengumpulkan QR hasil, lalu
            menghitung nilai dan mengekspor rekap CSV langsung di browser.
          </p>
          <span>
            Exam ID:{" "}
            <strong className="text-ink">
              {state.selectedExam?.payload.eid || "Belum ada"}
            </strong>
          </span>
        </div>
      </footer>
    </div>
  );
}
