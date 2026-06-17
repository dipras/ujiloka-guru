import {
  AnswerKeyEntry,
  ExamPayload,
  MVP_SCHEMA_VERSION,
  QR_CHUNK_VALUE_LIMIT,
  QrChunk,
  ResultPayload,
} from "./schema";

const textEncoder = new TextEncoder();
const textDecoder = new TextDecoder();

export function encodeJson(value: unknown) {
  return JSON.stringify(value);
}

export function decodeJson<T>(value: string): T {
  return JSON.parse(value) as T;
}

export function toBase64(value: string) {
  const bytes = textEncoder.encode(value);
  let binary = "";
  bytes.forEach((byte) => {
    binary += String.fromCharCode(byte);
  });
  return btoa(binary);
}

export function fromBase64(value: string) {
  const binary = atob(value);
  const bytes = Uint8Array.from(binary, (char) => char.charCodeAt(0));
  return textDecoder.decode(bytes);
}

export function protectAnswerKey(entries: AnswerKeyEntry[], secret: string) {
  const source = encodeJson(entries);
  const secretBytes = textEncoder.encode(secret || "lidm");
  const sourceBytes = textEncoder.encode(source);
  const protectedBytes = sourceBytes.map(
    (byte, index) => byte ^ secretBytes[index % secretBytes.length],
  );
  let binary = "";
  protectedBytes.forEach((byte) => {
    binary += String.fromCharCode(byte);
  });
  return btoa(binary);
}

export function revealAnswerKey(value: string, secret: string) {
  const protectedBytes = Uint8Array.from(atob(value), (char) =>
    char.charCodeAt(0),
  );
  const secretBytes = textEncoder.encode(secret || "lidm");
  const sourceBytes = protectedBytes.map(
    (byte, index) => byte ^ secretBytes[index % secretBytes.length],
  );
  return decodeJson<AnswerKeyEntry[]>(textDecoder.decode(sourceBytes));
}

export function makeExamPayload(
  payload: Omit<ExamPayload, "t" | "v">,
): ExamPayload {
  return {
    t: "exam",
    v: MVP_SCHEMA_VERSION,
    ...payload,
  };
}

export function makeResultPayload(
  payload: Omit<ResultPayload, "t" | "v">,
): ResultPayload {
  return {
    t: "result",
    v: MVP_SCHEMA_VERSION,
    ...payload,
  };
}

export function chunkString(id: string, raw: string): QrChunk[] {
  const encoded = toBase64(raw);
  const total = Math.max(1, Math.ceil(encoded.length / QR_CHUNK_VALUE_LIMIT));
  return Array.from({ length: total }, (_, index) => ({
    i: id,
    n: index,
    t: total,
    v: encoded.slice(
      index * QR_CHUNK_VALUE_LIMIT,
      (index + 1) * QR_CHUNK_VALUE_LIMIT,
    ),
  }));
}

export function stringifyChunk(chunk: QrChunk) {
  if (chunk.v.length > QR_CHUNK_VALUE_LIMIT) {
    throw new Error("QR chunk value exceeds 500 characters.");
  }
  return encodeJson(chunk);
}

export function tryParseQr(value: string) {
  const parsed = decodeJson<unknown>(value);
  if (isQrChunk(parsed)) {
    return parsed;
  }
  return parsed;
}

export function reconstructChunks(chunks: QrChunk[]) {
  if (chunks.length === 0) {
    throw new Error("Belum ada chunk untuk direkonstruksi.");
  }
  const [first] = chunks;
  const sameId = chunks.every((chunk) => chunk.i === first.i);
  const sameTotal = chunks.every((chunk) => chunk.t === first.t);
  if (!sameId || !sameTotal || chunks.length !== first.t) {
    throw new Error("Chunk belum lengkap atau tidak cocok.");
  }
  const sorted = [...chunks].sort((a, b) => a.n - b.n);
  return fromBase64(sorted.map((chunk) => chunk.v).join(""));
}

export function isQrChunk(value: unknown): value is QrChunk {
  if (!value || typeof value !== "object") return false;
  const item = value as Record<string, unknown>;
  return (
    typeof item.i === "string" &&
    typeof item.n === "number" &&
    typeof item.t === "number" &&
    typeof item.v === "string" &&
    item.v.length <= QR_CHUNK_VALUE_LIMIT
  );
}

export function isExamPayload(value: unknown): value is ExamPayload {
  if (!value || typeof value !== "object") return false;
  const item = value as Record<string, unknown>;
  return item.t === "exam" && item.v === MVP_SCHEMA_VERSION;
}

export function isResultPayload(value: unknown): value is ResultPayload {
  if (!value || typeof value !== "object") return false;
  const item = value as Record<string, unknown>;
  return item.t === "result" && item.v === MVP_SCHEMA_VERSION;
}
