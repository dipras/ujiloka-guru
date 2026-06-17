import { useEffect, useState } from "react";
import QRCode from "qrcode";

type QrImageProps = {
  value: string;
  label: string;
  size?: number;
};

export function QrImage({ value, label, size = 220 }: QrImageProps) {
  const [src, setSrc] = useState("");

  useEffect(() => {
    let active = true;
    QRCode.toDataURL(value, {
      errorCorrectionLevel: "M",
      margin: 2,
      width: size,
      color: {
        dark: "#162033",
        light: "#ffffff",
      },
    }).then((url) => {
      if (active) setSrc(url);
    });
    return () => {
      active = false;
    };
  }, [size, value]);

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
