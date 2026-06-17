import { useCallback, useEffect, useMemo, useState } from "react";
import {
  chunkString,
  decodeJson,
  encodeJson,
  isQrChunk,
  isResultPayload,
  reconstructChunks,
  revealAnswerKey,
  stringifyChunk,
} from "../lib/codec";
import { buildExamPayload, makeAnswerKeySecret } from "../lib/exam";
import {
  MAX_OPTIONS_PER_QUESTION,
  MIN_OPTIONS_PER_QUESTION,
  makeId,
  makeOptionId,
  makeSessionCode,
  makeInitialDraft,
  makeQuestion,
  normalizeDraft,
  type ExamDraft,
} from "../lib/factory";
import { renderQrBatch } from "../lib/qr";
import { scoreObjectiveResult } from "../lib/scoring";
import {
  CollectedResult,
  ExamPayload,
  QrChunk,
  ResultPayload,
} from "../lib/schema";

const STORAGE_KEY = "lidm-teacher-web.exams.v1";

export type PublishedExam = {
  id: string;
  payload: ExamPayload;
  chunks: QrChunk[];
  chunkValues: string[];
  createdAt: string;
  updatedAt: string;
  results: CollectedResult[];
};

function loadStoredExams(): PublishedExam[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? (parsed as PublishedExam[]) : [];
  } catch {
    return [];
  }
}

function examToDraft(exam: PublishedExam): ExamDraft {
  const answerKey = revealAnswerKey(
    exam.payload.ak,
    makeAnswerKeySecret(exam.payload.eid, exam.payload.sch),
  );

  return normalizeDraft({
    eid: makeId("exam"),
    ttl: `${exam.payload.ttl} Revisi`,
    subj: exam.payload.subj,
    cls: exam.payload.cls,
    dur: exam.payload.dur,
    sch: makeSessionCode(),
    qs: exam.payload.qs.map((question) => ({
      ...question,
      opts: question.opts.map((option) => ({ ...option })),
    })),
    ak: answerKey,
  });
}

export function useTeacherState() {
  const [exams, setExams] = useState<PublishedExam[]>(() => loadStoredExams());
  const [draft, setDraft] = useState<ExamDraft>(() => makeInitialDraft());
  const [selectedExamId, setSelectedExamId] = useState("");
  const [slideIndex, setSlideIndex] = useState(0);
  const [slideSpeed, setSlideSpeed] = useState(1800);
  const [manualResult, setManualResult] = useState("");
  const [collectorMessage, setCollectorMessage] = useState("");
  const [resultChunks, setResultChunks] = useState<Record<string, QrChunk[]>>({});
  const [qrCache, setQrCache] = useState<Record<string, string[]>>({});
  const [preparingExamId, setPreparingExamId] = useState("");

  const selectedExam = useMemo(
    () =>
      exams.find((exam) => exam.id === selectedExamId) ||
      exams[0] ||
      null,
    [exams, selectedExamId],
  );

  useEffect(() => {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(exams));
  }, [exams]);

  useEffect(() => {
    if (!selectedExamId && exams[0]) {
      setSelectedExamId(exams[0].id);
    }
  }, [exams, selectedExamId]);

  useEffect(() => {
    const qrImages = selectedExam ? qrCache[selectedExam.id] || [] : [];
    if (qrImages.length <= 1) return;
    const timer = window.setInterval(() => {
      setSlideIndex((current) => (current + 1) % qrImages.length);
    }, slideSpeed);
    return () => window.clearInterval(timer);
  }, [qrCache, selectedExam, slideSpeed]);

  useEffect(() => {
    setSlideIndex(0);
  }, [selectedExam?.id]);

  function startNewDraft() {
    setDraft(makeInitialDraft());
  }

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

  function addOption(qid: string) {
    setDraft((current) => ({
      ...current,
      qs: current.qs.map((question) => {
        if (
          question.id !== qid ||
          question.opts.length >= MAX_OPTIONS_PER_QUESTION
        ) {
          return question;
        }
        return {
          ...question,
          opts: [
            ...question.opts,
            {
              id: makeOptionId(question.opts.length),
              txt: "",
            },
          ],
        };
      }),
    }));
  }

  function removeOption(qid: string, oid: string) {
    setDraft((current) => {
      const question = current.qs.find((item) => item.id === qid);
      const remainingOptions =
        question?.opts.filter((option) => option.id !== oid) || [];
      const reindexedOptions = remainingOptions.map((option, index) => ({
        ...option,
        id: makeOptionId(index),
      }));

      return {
        ...current,
        qs: current.qs.map((question) => {
        if (
          question.id !== qid ||
          question.opts.length <= MIN_OPTIONS_PER_QUESTION
        ) {
          return question;
        }
        return {
          ...question,
          opts: reindexedOptions,
        };
      }),
      ak: current.ak.map((entry) => {
        if (entry.qid !== qid) return entry;
        const selectedNewIndex = remainingOptions.findIndex(
          (option) => option.id === entry.oid,
        );
        if (selectedNewIndex >= 0) {
          return {
            ...entry,
            oid: makeOptionId(selectedNewIndex),
          };
        }
        return {
          ...entry,
          oid: reindexedOptions[0]?.id || makeOptionId(0),
        };
      }),
      };
    });
  }

  async function publishDraft() {
    const normalized = normalizeDraft(draft);
    const payload = buildExamPayload(normalized);
    const examJson = encodeJson(payload);
    const chunks = chunkString(payload.eid, examJson);
    const chunkValues = chunks.map((chunk) => stringifyChunk(chunk));
    setPreparingExamId(payload.eid);
    const qrImages = await renderQrBatch(chunkValues, 360);
    const now = new Date().toISOString();
    const published: PublishedExam = {
      id: payload.eid,
      payload,
      chunks,
      chunkValues,
      createdAt: now,
      updatedAt: now,
      results: [],
    };

    setExams((current) => [
      published,
      ...current.filter((exam) => exam.id !== published.id),
    ]);
    setQrCache((current) => ({ ...current, [published.id]: qrImages }));
    setSelectedExamId(published.id);
    setPreparingExamId("");
    return published;
  }

  const ensureQrImages = useCallback(
    async (examId: string) => {
      const exam = exams.find((item) => item.id === examId);
      if (!exam) return [];
      const cached = qrCache[examId];
      if (cached?.length === exam.chunkValues.length) return cached;

      setPreparingExamId(examId);
      const qrImages = await renderQrBatch(exam.chunkValues, 360);
      setQrCache((current) => ({ ...current, [examId]: qrImages }));
      setPreparingExamId("");
      return qrImages;
    },
    [exams, qrCache],
  );

  function duplicateExamToDraft(examId: string) {
    const exam = exams.find((item) => item.id === examId);
    if (!exam) return null;
    const nextDraft = examToDraft(exam);
    setDraft(nextDraft);
    return nextDraft;
  }

  const collectResult = useCallback(
    (examId: string, result: ResultPayload) => {
      setExams((current) =>
        current.map((exam) => {
          if (exam.id !== examId) return exam;
          const answerKey = revealAnswerKey(
            exam.payload.ak,
            makeAnswerKeySecret(exam.payload.eid, exam.payload.sch),
          );
          const duplicate = exam.results.some(
            (item) =>
              item.result.rid === result.rid ||
              item.result.stu.sid === result.stu.sid ||
              item.result.stu.code === result.stu.code,
          );
          const status =
            result.eid !== exam.id
              ? "exam-mismatch"
              : duplicate
                ? "duplicate"
                : "valid";
          const score = scoreObjectiveResult(exam.payload.qs, answerKey, result);
          setCollectorMessage(
            status === "valid"
              ? `Hasil ${result.stu.name || result.stu.sid} tersimpan.`
              : status === "duplicate"
                ? "Hasil terdeteksi duplikat dan tetap ditandai di tabel."
                : "ID ujian hasil tidak cocok dengan paket aktif.",
          );
          return {
            ...exam,
            updatedAt: new Date().toISOString(),
            results: [{ result, score, status }, ...exam.results],
          };
        }),
      );
    },
    [],
  );

  const processResultQr = useCallback(
    (examId: string, value: string) => {
      try {
        const parsed = decodeJson<unknown>(value.trim());
        if (isResultPayload(parsed)) {
          collectResult(examId, parsed);
          return;
        }

        if (isQrChunk(parsed)) {
          const bufferKey = `${examId}:${parsed.i}`;
          const existing = resultChunks[bufferKey] || [];
          const withoutDuplicate = existing.filter((chunk) => chunk.n !== parsed.n);
          const nextChunks = [...withoutDuplicate, parsed].sort((a, b) => a.n - b.n);
          setResultChunks((current) => ({
            ...current,
            [bufferKey]: nextChunks,
          }));

          if (nextChunks.length === parsed.t) {
            const reconstructed = reconstructChunks(nextChunks);
            const result = decodeJson<unknown>(reconstructed);
            if (!isResultPayload(result)) {
              throw new Error("Chunk lengkap, tetapi payload bukan hasil.");
            }
            collectResult(examId, result);
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
    addOption,
    collectorMessage,
    draft,
    duplicateExamToDraft,
    ensureQrImages,
    exams,
    manualResult,
    preparingExamId,
    processResultQr,
    publishDraft,
    qrCache,
    removeQuestion,
    removeOption,
    selectedExam,
    selectedExamId,
    setAnswer,
    setDraft,
    setManualResult,
    setSelectedExamId,
    setSlideSpeed,
    slideIndex,
    slideSpeed,
    startNewDraft,
    updateQuestion,
  };
}
