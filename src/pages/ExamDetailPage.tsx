import { Copy, Maximize2, Printer, ScanLine, Table2, X } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { Metric } from "../components/Metric";
import { QrImage } from "../components/QrImage";
import { SectionTitle } from "../components/SectionTitle";
import { useTeacher } from "../teacher/teacherContext";

export function ExamDetailPage() {
  const { id = "" } = useParams();
  const navigate = useNavigate();
  const {
    duplicateExamToDraft,
    ensureQrImages,
    exams,
    preparingExamId,
    qrCache,
    setSelectedExamId,
    setSlideSpeed,
    slideIndex,
    slideSpeed,
  } = useTeacher();
  const exam = exams.find((item) => item.id === id);
  const qrImages = qrCache[id] || [];
  const [isFullscreen, setIsFullscreen] = useState(false);
  const activeSlide = useMemo(() => {
    if (qrImages.length === 0) return 0;
    return slideIndex % qrImages.length;
  }, [qrImages.length, slideIndex]);

  useEffect(() => {
    if (!exam) return;
    setSelectedExamId(exam.id);
    ensureQrImages(exam.id);
  }, [ensureQrImages, exam, setSelectedExamId]);

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

  const validResults = exam.results.filter((item) => item.status === "valid").length;
  const isPreparing = preparingExamId === exam.id || qrImages.length === 0;

  return (
    <section className="flex flex-col gap-5">
      <div className="card">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <SectionTitle
            description={`${exam.payload.subj || "-"} - ${exam.payload.cls || "-"} - ${exam.payload.dur} menit`}
            title={exam.payload.ttl || "Tanpa judul"}
          />
          <div className="flex flex-wrap gap-2 no-print">
            <button
              className="btn btn-secondary"
              onClick={() => {
                duplicateExamToDraft(exam.id);
                navigate("/exams/new");
              }}
              type="button"
            >
              <Copy size={16} />
              Duplicate revisi
            </button>
            <Link className="btn btn-secondary" to={`/collect/${exam.id}`}>
              <ScanLine size={16} />
              Kumpulkan
            </Link>
            <Link className="btn btn-secondary" to={`/recap/${exam.id}`}>
              <Table2 size={16} />
              Rekap
            </Link>
          </div>
        </div>

        <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
          <Metric label="Soal" value={`${exam.payload.qs.length} soal`} />
          <Metric label="Kode sesi" value={exam.payload.sch || "-"} />
          <Metric label="QR" value={`${exam.chunks.length} chunk`} />
          <Metric label="Hasil" value={`${validResults}/${exam.results.length} valid`} />
          <Metric
            label="Dibuat"
            value={new Date(exam.createdAt).toLocaleDateString("id-ID")}
          />
        </div>
      </div>

      <section className="card">
        <SectionTitle title="Soal Ujian" />
        <div className="mt-4 grid gap-4">
          {exam.payload.qs.map((question, index) => (
            <article className="rounded-lg border border-line bg-white p-4" key={question.id}>
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <h3 className="font-bold text-ink">Soal {index + 1}</h3>
                  <p className="mt-1 text-sm text-ink">{question.txt || "-"}</p>
                </div>
                <span className="badge">{question.pts} poin</span>
              </div>
              <div className="mt-3 grid gap-2 md:grid-cols-2">
                {question.opts.map((option) => (
                  <div className="rounded-md border border-line px-3 py-2 text-sm" key={option.id}>
                    <span className="font-semibold text-ink">
                      {option.id.toUpperCase()}
                    </span>
                    <span className="ml-2 text-muted">{option.txt || "-"}</span>
                  </div>
                ))}
              </div>
            </article>
          ))}
        </div>
      </section>

      <section className="card">
        <div className="mb-4 flex flex-wrap items-start justify-between gap-4">
          <SectionTitle
            description="QR sudah dibuat dari payload final. Slideshow memakai image yang sudah siap agar tidak blank saat switch."
            title="QR Distribusi"
          />
          <div className="flex flex-wrap gap-2 no-print">
            <button
              className="btn btn-secondary"
              disabled={isPreparing}
              onClick={() => window.print()}
              type="button"
            >
              <Printer size={16} />
              Cetak
            </button>
            <button
              className="btn btn-primary"
              disabled={isPreparing}
              onClick={() => setIsFullscreen(true)}
              type="button"
            >
              <Maximize2 size={16} />
              Fullscreen
            </button>
          </div>
        </div>

        {isPreparing ? (
          <div className="grid min-h-[280px] place-items-center rounded-lg border border-dashed border-line bg-slate-50 text-center">
            <div>
              <p className="font-semibold text-ink">Menyiapkan QR...</p>
              <p className="mt-1 text-sm text-muted">Semua QR dirender dulu sebelum slideshow aktif.</p>
            </div>
          </div>
        ) : (
          <>
            <div className="mb-5 grid gap-4 lg:grid-cols-[minmax(0,1fr)_340px] no-print">
              <div className="grid place-items-center rounded-lg border border-line bg-slate-50 p-6">
                <QrImage
                  label={`${activeSlide + 1}/${exam.chunks.length} - slideshow`}
                  size={300}
                  src={qrImages[activeSlide]}
                  value={exam.chunkValues[activeSlide]}
                />
              </div>
              <div className="rounded-lg border border-line p-4">
                <h3 className="font-bold text-ink">Slideshow Looping</h3>
                <p className="mt-1 text-sm leading-6 text-muted">
                  Gunakan fullscreen untuk proyektor. Semua QR sudah berada di memory.
                </p>
                <label className="mt-4 block">
                  <span className="label">Speed per QR: {slideSpeed} ms</span>
                  <input
                    className="w-full accent-primary"
                    max={5000}
                    min={300}
                    onChange={(event) => setSlideSpeed(Number(event.target.value))}
                    step={100}
                    type="range"
                    value={slideSpeed}
                  />
                </label>
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
              {exam.chunkValues.map((value, index) => (
                <div className="print-page" key={`${exam.id}-${index}`}>
                  <QrImage
                    label={`${index + 1}/${exam.chunks.length} - ${exam.chunks[index].v.length} char`}
                    size={260}
                    src={qrImages[index]}
                    value={value}
                  />
                </div>
              ))}
            </div>
          </>
        )}
      </section>

      {isFullscreen && qrImages.length > 0 ? (
        <FullscreenQr
          index={activeSlide}
          onClose={() => setIsFullscreen(false)}
          onSpeedChange={setSlideSpeed}
          qrImages={qrImages}
          slideSpeed={slideSpeed}
          title={exam.payload.ttl}
          values={exam.chunkValues}
        />
      ) : null}
    </section>
  );
}

function FullscreenQr({
  index,
  onClose,
  onSpeedChange,
  qrImages,
  slideSpeed,
  title,
  values,
}: {
  index: number;
  onClose: () => void;
  onSpeedChange: (speed: number) => void;
  qrImages: string[];
  slideSpeed: number;
  title: string;
  values: string[];
}) {
  return (
    <div className="fixed inset-0 z-50 grid bg-white p-5">
      <div className="flex items-center justify-between gap-4 no-print">
        <div>
          <p className="text-sm font-semibold uppercase tracking-wide text-primary">
            Fullscreen QR
          </p>
          <h2 className="text-2xl font-bold text-ink">{title || "Ujian"}</h2>
        </div>
        <button className="btn btn-secondary" onClick={onClose} type="button">
          <X size={16} />
          Tutup
        </button>
      </div>

      <div className="grid place-items-center">
        <div className="flex flex-col items-center gap-4">
          <img
            alt={`QR ${index + 1}/${qrImages.length}`}
            className="h-[min(68vh,680px)] w-[min(68vh,680px)] object-contain"
            src={qrImages[index]}
          />
          <div className="text-center">
            <p className="text-3xl font-bold text-ink">
              {index + 1}/{qrImages.length}
            </p>
            <p className="mt-1 text-sm text-muted">
              {values[index].length.toLocaleString("id-ID")} karakter payload QR
            </p>
          </div>
        </div>
      </div>

      <label className="mx-auto w-full max-w-md self-end no-print">
        <span className="label">Speed per QR: {slideSpeed} ms</span>
        <input
          className="w-full accent-primary"
          max={5000}
          min={800}
          onChange={(event) => onSpeedChange(Number(event.target.value))}
          step={100}
          type="range"
          value={slideSpeed}
        />
      </label>
    </div>
  );
}
