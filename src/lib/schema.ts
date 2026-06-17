export const MVP_SCHEMA_VERSION = 1;
export const QR_CHUNK_VALUE_LIMIT = 500;

export type Option = {
  id: string;
  txt: string;
};

export type Question = {
  id: string;
  txt: string;
  pts: number;
  opts: Option[];
};

export type AnswerKeyEntry = {
  qid: string;
  oid: string;
};

export type ExamPayload = {
  t: "exam";
  v: number;
  eid: string;
  sch: string;
  dur: number;
  ttl: string;
  subj: string;
  cls: string;
  ak: string;
  qs: Question[];
};

export type StudentIdentity = {
  sid: string;
  name: string;
  cls: string;
  code: string;
};

export type ResultPayload = {
  t: "result";
  v: number;
  eid: string;
  rid: string;
  stu: StudentIdentity;
  ans: Record<string, string>;
  ec: number;
  log: {
    bg: number;
    fg: number;
  };
  sub: string;
};

export type QrChunk = {
  i: string;
  n: number;
  t: number;
  v: string;
};

export type ObjectiveScore = {
  score: number;
  maxScore: number;
  percentage: number;
  correct: number;
  totalQuestions: number;
};

export type CollectedResult = {
  result: ResultPayload;
  score: ObjectiveScore;
  status: "valid" | "duplicate" | "exam-mismatch";
};
