import { AnswerKeyEntry, ObjectiveScore, Question, ResultPayload } from "./schema";

export function scoreObjectiveResult(
  questions: Question[],
  answerKey: AnswerKeyEntry[],
  result: ResultPayload,
): ObjectiveScore {
  const keyByQuestion = new Map(answerKey.map((entry) => [entry.qid, entry.oid]));
  let score = 0;
  let maxScore = 0;
  let correct = 0;

  questions.forEach((question) => {
    maxScore += question.pts;
    if (result.ans[question.id] === keyByQuestion.get(question.id)) {
      score += question.pts;
      correct += 1;
    }
  });

  return {
    score,
    maxScore,
    correct,
    totalQuestions: questions.length,
  };
}
