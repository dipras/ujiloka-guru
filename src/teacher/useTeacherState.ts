import { useCallback, useEffect, useMemo, useState } from "react";
import {
  chunkString,
  decodeJson,
  encodeJson,
  isQrChunk,
  isResultPayload,
  reconstructChunks,
  stringifyChunk,
} from "../lib/codec";
import { buildExamPayload } from "../lib/exam";
import {
  makeInitialDraft,
  makeQuestion,
  normalizeDraft,
  type ExamDraft,
} from "../lib/factory";
import { scoreObjectiveResult } from "../lib/scoring";
import { CollectedResult, QrChunk, ResultPayload } from "../lib/schema";

export function useTeacherState() {
  const [draft, setDraft] = useState<ExamDraft>(() => makeInitialDraft());
  const [slideIndex, setSlideIndex] = useState(0);
  const [slideSpeed, setSlideSpeed] = useState(1800);
  const [manualResult, setManualResult] = useState("");
  const [collectorMessage, setCollectorMessage] = useState("");
  const [resultChunks, setResultChunks] = useState<Record<string, QrChunk[]>>({});
  const [results, setResults] = useState<CollectedResult[]>([]);

  const normalized = useMemo(() => normalizeDraft(draft), [draft]);
  const examPayload = useMemo(() => buildExamPayload(draft), [draft]);
  const examJson = useMemo(() => encodeJson(examPayload), [examPayload]);
  const examChunks = useMemo(
    () => chunkString(examPayload.eid, examJson),
    [examJson, examPayload.eid],
  );
  const examChunkValues = useMemo(
    () => examChunks.map((chunk) => stringifyChunk(chunk)),
    [examChunks],
  );
  const answerMap = useMemo(
    () => new Map(draft.ak.map((entry) => [entry.qid, entry.oid])),
    [draft.ak],
  );
  const validResults = results.filter((item) => item.status === "valid");

  useEffect(() => {
    if (examChunkValues.length <= 1) return;
    const timer = window.setInterval(() => {
      setSlideIndex((current) => (current + 1) % examChunkValues.length);
    }, slideSpeed);
    return () => window.clearInterval(timer);
  }, [examChunkValues.length, slideSpeed]);

  useEffect(() => {
    setSlideIndex(0);
  }, [examPayload.eid, examChunkValues.length]);

  function updateQuestion(
    qid: string,
    updater: (question: ExamDraft["qs"][number]) => ExamDraft["qs"][number],
  ) {
    setDraft((current) => ({
      ...current,
      qs: current.qs.map((question) =>
        question.id === qid ? updater(question) : question,
      ),
    }));
  }

  function setAnswer(qid: string, oid: string) {
    setDraft((current) => ({
      ...current,
      ak: current.ak.some((entry) => entry.qid === qid)
        ? current.ak.map((entry) =>
            entry.qid === qid ? { ...entry, oid } : entry,
          )
        : [...current.ak, { qid, oid }],
    }));
  }

  function addQuestion() {
    setDraft((current) => {
      const question = makeQuestion(current.qs.length + 1);
      return {
        ...current,
        qs: [...current.qs, question],
        ak: [...current.ak, { qid: question.id, oid: question.opts[0].id }],
      };
    });
  }

  function removeQuestion(qid: string) {
    setDraft((current) => {
      if (current.qs.length === 1) return current;
      return {
        ...current,
        qs: current.qs.filter((question) => question.id !== qid),
        ak: current.ak.filter((entry) => entry.qid !== qid),
      };
    });
  }

  const collectResult = useCallback(
    (result: ResultPayload) => {
      const duplicate = results.some(
        (item) =>
          item.result.rid === result.rid ||
          item.result.stu.sid === result.stu.sid ||
          item.result.stu.code === result.stu.code,
      );
      const status =
        result.eid !== normalized.eid
          ? "exam-mismatch"
          : duplicate
            ? "duplicate"
            : "valid";
      const score = scoreObjectiveResult(normalized.qs, normalized.ak, result);
      setResults((current) => [{ result, score, status }, ...current]);
      setCollectorMessage(
        status === "valid"
          ? `Hasil ${result.stu.name || result.stu.sid} tersimpan.`
          : status === "duplicate"
            ? "Hasil terdeteksi duplikat dan tetap ditandai di tabel."
            : "ID ujian hasil tidak cocok dengan paket aktif.",
      );
    },
    [normalized.ak, normalized.eid, normalized.qs, results],
  );

  const processResultQr = useCallback(
    (value: string) => {
      try {
        const parsed = decodeJson<unknown>(value.trim());
        if (isResultPayload(parsed)) {
          collectResult(parsed);
          return;
        }

        if (isQrChunk(parsed)) {
          const existing = resultChunks[parsed.i] || [];
          const withoutDuplicate = existing.filter((chunk) => chunk.n !== parsed.n);
          const nextChunks = [...withoutDuplicate, parsed].sort((a, b) => a.n - b.n);
          setResultChunks((current) => ({
            ...current,
            [parsed.i]: nextChunks,
          }));

          if (nextChunks.length === parsed.t) {
            const reconstructed = reconstructChunks(nextChunks);
            const result = decodeJson<unknown>(reconstructed);
            if (!isResultPayload(result)) {
              throw new Error("Chunk lengkap, tetapi payload bukan hasil.");
            }
            collectResult(result);
          } else {
            setCollectorMessage(
              `Chunk hasil ${parsed.i}: ${nextChunks.length}/${parsed.t}`,
            );
          }
          return;
        }

        throw new Error("QR bukan payload hasil atau chunk MVP.");
      } catch (error) {
        setCollectorMessage(
          error instanceof Error ? error.message : "Payload hasil tidak valid.",
        );
      }
    },
    [collectResult, resultChunks],
  );

  return {
    addQuestion,
    answerMap,
    collectorMessage,
    draft,
    examChunkValues,
    examChunks,
    examJson,
    examPayload,
    manualResult,
    normalized,
    processResultQr,
    removeQuestion,
    results,
    setAnswer,
    setDraft,
    setManualResult,
    setSlideSpeed,
    slideIndex,
    slideSpeed,
    updateQuestion,
    validResults,
  };
}
