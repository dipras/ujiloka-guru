import { Camera, CameraOff } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";

type ResultScannerProps = {
  onScan: (value: string) => void;
};

type Html5QrcodeInstance = {
  clear: () => void;
  getState: () => number;
  start: (
    cameraConfig: { facingMode: string },
    config: {
      fps: number;
      qrbox: { width: number; height: number };
      aspectRatio: number;
      experimentalFeatures: { useBarCodeDetectorIfSupported: boolean };
    },
    onSuccess: (decodedText: string) => void,
    onError: () => void,
  ) => Promise<unknown>;
  stop: () => Promise<void>;
};

const scannerState = {
  scanning: 2,
  paused: 3,
};

export function ResultScanner({ onScan }: ResultScannerProps) {
  const [active, setActive] = useState(false);
  const [error, setError] = useState("");
  const [status, setStatus] = useState("");
  const readerId = "result-reader";
  const onScanRef = useRef(onScan);
  const scannerRef = useRef<Html5QrcodeInstance | null>(null);
  const lastScanRef = useRef<{ value: string; scannedAt: number } | null>(null);
  const runningRef = useRef(false);

  useEffect(() => {
    onScanRef.current = onScan;
  }, [onScan]);

  const stopScanner = useCallback(async (scanner: Html5QrcodeInstance) => {
    let canStop = runningRef.current;
    try {
      const state = scanner.getState();
      canStop = state === scannerState.scanning || state === scannerState.paused;
    } catch {
      canStop = runningRef.current;
    }

    if (!canStop) {
      runningRef.current = false;
      return;
    }

    try {
      await scanner.stop();
    } catch {
      // Stop is not valid while html5-qrcode is still starting or already stopped.
    } finally {
      runningRef.current = false;
      try {
        scanner.clear();
      } catch {
        // Clear may throw when the reader element has already been cleaned up.
      }
    }
  }, []);

  function handleDecodedText(decodedText: string) {
    const now = Date.now();
    const lastScan = lastScanRef.current;
    if (
      lastScan?.value === decodedText &&
      now - lastScan.scannedAt < 1_500
    ) {
      return;
    }

    lastScanRef.current = { value: decodedText, scannedAt: now };
    setStatus("QR terbaca, memproses payload...");
    onScanRef.current(decodedText);
  }

  useEffect(() => {
    if (!active) return;
    let cancelled = false;

    async function startScanner() {
      try {
        setError("");
        setStatus("Menyalakan kamera...");
        const { Html5Qrcode } = await import("html5-qrcode");
        if (cancelled) return;
        const scanner = new Html5Qrcode(readerId) as Html5QrcodeInstance;
        scannerRef.current = scanner;
        await scanner.start(
          { facingMode: "environment" },
          {
            aspectRatio: 1.333,
            experimentalFeatures: { useBarCodeDetectorIfSupported: true },
            fps: 12,
            qrbox: { width: 300, height: 300 },
          },
          (decodedText) => handleDecodedText(decodedText),
          () => undefined,
        );
        runningRef.current = true;
        setStatus("Scanner aktif. Dekatkan QR hasil ke tengah kamera.");
        if (cancelled) {
          await stopScanner(scanner);
        }
      } catch (scanError) {
        if (cancelled) return;
        setError(scanError instanceof Error ? scanError.message : "Kamera gagal.");
        setStatus("");
        setActive(false);
      }
    }

    startScanner();

    return () => {
      cancelled = true;
      const scanner = scannerRef.current;
      scannerRef.current = null;
      if (scanner && runningRef.current) {
        void stopScanner(scanner);
      } else {
        runningRef.current = false;
      }
      setStatus("");
    };
  }, [active, stopScanner]);

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
      {status ? <p className="mt-3 text-sm font-semibold text-primary">{status}</p> : null}
      <div
        className="mt-4 min-h-[280px] overflow-hidden rounded-md bg-slate-100"
        id={readerId}
      />
    </div>
  );
}
