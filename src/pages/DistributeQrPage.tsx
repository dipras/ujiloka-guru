import { Printer, QrCode } from "lucide-react";
import { QrImage } from "../components/QrImage";
import { SectionTitle } from "../components/SectionTitle";
import { useTeacher } from "../teacher/teacherContext";

export function DistributeQrPage() {
  const {
    examChunkValues,
    examChunks,
    examJson,
    examPayload,
    setSlideSpeed,
    slideIndex,
    slideSpeed,
  } = useTeacher();

  return (
    <section className="card">
      <div className="mb-4 flex flex-wrap items-start justify-between gap-4">
        <SectionTitle
          description="Siswa dapat memindai chunk dalam urutan bebas. Nilai v tiap chunk maksimal 500 karakter."
          icon={<QrCode size={20} />}
          title="QR Ujian Multi-Chunk"
        />
        <div className="flex flex-wrap gap-2 no-print">
          <span className="badge">
            Payload {examJson.length.toLocaleString("id-ID")} karakter
          </span>
          <span className="badge">{examChunks.length} QR</span>
          <button
            className="btn btn-secondary"
            type="button"
            onClick={() => window.print()}
          >
            <Printer size={16} />
            Cetak
          </button>
        </div>
      </div>

      <div className="mb-5 grid gap-4 lg:grid-cols-[minmax(0,1fr)_340px] no-print">
        <div className="grid place-items-center rounded-lg border border-line bg-slate-50 p-6">
          <QrImage
            key={`slide-${examPayload.eid}-${slideIndex}`}
            label={`${slideIndex + 1}/${examChunks.length} - slideshow`}
            size={300}
            value={examChunkValues[slideIndex]}
          />
        </div>
        <div className="rounded-lg border border-line p-4">
          <h3 className="font-bold text-ink">Slideshow Looping</h3>
          <p className="mt-1 text-sm leading-6 text-muted">
            Tampilkan panel ini di proyektor agar siswa dapat memindai chunk
            satu per satu.
          </p>
          <label className="mt-4 block">
            <span className="label">Speed per QR: {slideSpeed} ms</span>
            <input
              className="w-full accent-primary"
              max={5000}
              min={800}
              onChange={(event) => setSlideSpeed(Number(event.target.value))}
              step={100}
              type="range"
              value={slideSpeed}
            />
          </label>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {examChunkValues.map((value, index) => (
          <div className="print-page" key={`${examPayload.eid}-${index}`}>
            <QrImage
              label={`${index + 1}/${examChunks.length} - ${examChunks[index].v.length} char`}
              value={value}
            />
          </div>
        ))}
      </div>
    </section>
  );
}
