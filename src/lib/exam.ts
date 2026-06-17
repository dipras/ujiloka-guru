import { protectAnswerKey } from "./codec";
import { ExamDraft, normalizeDraft } from "./factory";
import { makeExamPayload } from "./codec";

export function buildExamPayload(draft: ExamDraft) {
  const normalized = normalizeDraft(draft);
  const secret = makeAnswerKeySecret(normalized.eid, normalized.sch);

  return makeExamPayload({
    eid: normalized.eid,
    sch: normalized.sch,
    dur: normalized.dur,
    ttl: normalized.ttl,
    subj: normalized.subj,
    cls: normalized.cls,
    ak: protectAnswerKey(normalized.ak, secret),
    qs: normalized.qs.map((question) => ({
      ...question,
      opts: question.opts.map((option) => ({ ...option })),
    })),
  });
}

export function makeAnswerKeySecret(eid: string, sessionCode: string) {
  return `${eid}:${sessionCode || "lidm-session"}`;
}
