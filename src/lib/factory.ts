import { AnswerKeyEntry, Question } from "./schema";

export type ExamDraft = {
  eid: string;
  ttl: string;
  subj: string;
  cls: string;
  dur: number;
  sch: string;
  qs: Question[];
  ak: AnswerKeyEntry[];
};

export function makeId(prefix: string) {
  return `${prefix}-${Date.now().toString(36)}-${Math.random()
    .toString(36)
    .slice(2, 7)}`;
}

export function makeSessionCode() {
  return Math.random().toString(36).slice(2, 8).toUpperCase();
}

export function makeQuestion(index: number): Question {
  const qid = `q${index}`;
  return {
    id: qid,
    txt: "",
    pts: 1,
    opts: ["o1", "o2", "o3", "o4"].map((id) => ({
      id,
      txt: "",
    })),
  };
}

export function makeInitialDraft(): ExamDraft {
  const firstQuestion = makeQuestion(1);
  return {
    eid: makeId("exam"),
    ttl: "Ujian Objektif MVP",
    subj: "",
    cls: "",
    dur: 45,
    sch: makeSessionCode(),
    qs: [firstQuestion],
    ak: [{ qid: firstQuestion.id, oid: firstQuestion.opts[0].id }],
  };
}

export function normalizeDraft(draft: ExamDraft): ExamDraft {
  const questions = draft.qs.map((question, index) => {
    const id = question.id.trim() || `q${index + 1}`;
    return {
      ...question,
      id,
      txt: question.txt.trim(),
      pts: Number.isFinite(question.pts) ? Math.max(0, question.pts) : 0,
      opts: question.opts.map((option, optionIndex) => ({
        id: option.id.trim() || `o${optionIndex + 1}`,
        txt: option.txt.trim(),
      })),
    };
  });

  return {
    ...draft,
    eid: draft.eid.trim() || makeId("exam"),
    ttl: draft.ttl.trim(),
    subj: draft.subj.trim(),
    cls: draft.cls.trim(),
    sch: draft.sch.trim() || makeSessionCode(),
    dur: Math.max(1, Math.round(draft.dur || 1)),
    qs: questions,
    ak: questions.map((question) => {
      const existing = draft.ak.find((entry) => entry.qid === question.id);
      const validOption = question.opts.some((option) => option.id === existing?.oid);
      return {
        qid: question.id,
        oid: validOption ? existing!.oid : question.opts[0]?.id || "",
      };
    }),
  };
}
