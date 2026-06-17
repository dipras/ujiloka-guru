import { useEffect, useState } from "react";
import { renderQrDataUrl } from "../lib/qr";

type QrImageProps = {
  value: string;
  label: string;
  src?: string;
  size?: number;
};

export function QrImage({ value, label, src: providedSrc, size = 220 }: QrImageProps) {
  const [generatedSrc, setGeneratedSrc] = useState("");
  const src = providedSrc || generatedSrc;

  useEffect(() => {
    if (providedSrc) return;
    let active = true;
    renderQrDataUrl(value, size).then((url) => {
      if (active) setGeneratedSrc(url);
    });
    return () => {
      active = false;
    };
  }, [providedSrc, size, value]);

  return (
    <figure className="flex flex-col items-center gap-3 rounded-lg border border-line bg-white p-4">
      {src ? (
        <img
          alt={label}
          className="aspect-square w-full max-w-[220px]"
          height={size}
          src={src}
          width={size}
        />
      ) : (
        <div className="grid aspect-square w-full max-w-[220px] place-items-center rounded-md bg-slate-100 text-sm text-muted">
          Membuat QR
        </div>
      )}
      <figcaption className="text-center text-sm font-semibold text-ink">
        {label}
      </figcaption>
    </figure>
  );
}
