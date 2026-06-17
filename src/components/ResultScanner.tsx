import { Camera, CameraOff } from "lucide-react";
import { useEffect, useRef, useState } from "react";

type ResultScannerProps = {
  onScan: (value: string) => void;
};

export function ResultScanner({ onScan }: ResultScannerProps) {
  const [active, setActive] = useState(false);
  const [error, setError] = useState("");
  const readerId = "result-reader";
  const scannerRef = useRef<{ stop: () => Promise<void>; clear: () => void } | null>(
    null,
  );

  useEffect(() => {
    if (!active) return;
    let cancelled = false;

    async function startScanner() {
      try {
        const { Html5Qrcode } = await import("html5-qrcode");
        if (cancelled) return;
        const scanner = new Html5Qrcode(readerId);
        scannerRef.current = scanner;
        await scanner.start(
          { facingMode: "environment" },
          { fps: 8, qrbox: { width: 260, height: 260 } },
          (decodedText) => onScan(decodedText),
          undefined,
        );
      } catch (scanError) {
        setError(scanError instanceof Error ? scanError.message : "Kamera gagal.");
        setActive(false);
      }
    }

    startScanner();

    return () => {
      cancelled = true;
      if (scannerRef.current) {
        scannerRef.current
          .stop()
          .catch(() => undefined)
          .finally(() => scannerRef.current?.clear());
      }
      scannerRef.current = null;
    };
  }, [active, onScan]);

  return (
    <div className="rounded-lg border border-line p-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h3 className="font-bold text-ink">Scan QR Hasil</h3>
          <p className="mt-1 text-sm text-muted">
            Browser akan meminta izin kamera saat scanner dinyalakan.
          </p>
        </div>
        <button
          className={active ? "btn btn-danger" : "btn btn-secondary"}
          type="button"
          onClick={() => setActive((current) => !current)}
        >
          {active ? <CameraOff size={16} /> : <Camera size={16} />}
          {active ? "Stop" : "Scan"}
        </button>
      </div>
      {error ? <p className="mt-3 text-sm text-danger">{error}</p> : null}
      <div
        className="mt-4 min-h-[280px] overflow-hidden rounded-md bg-slate-100"
        id={readerId}
      />
    </div>
  );
}
