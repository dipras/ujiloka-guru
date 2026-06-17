import QRCode from "qrcode";

export function renderQrDataUrl(value: string, size = 300) {
  return QRCode.toDataURL(value, {
    errorCorrectionLevel: "M",
    margin: 2,
    width: size,
    color: {
      dark: "#162033",
      light: "#ffffff",
    },
  });
}

export function renderQrBatch(values: string[], size = 300) {
  return Promise.all(values.map((value) => renderQrDataUrl(value, size)));
}
