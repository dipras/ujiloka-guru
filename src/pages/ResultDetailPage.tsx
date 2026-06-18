import { ArrowLeft, Check, UserRound } from "lucide-react";
import { useEffect, useMemo } from "react";
import { Link, useParams } from "react-router-dom";
import { Metric } from "../components/Metric";
import { SectionTitle } from "../components/SectionTitle";
import { revealAnswerKey } from "../lib/codec";
import { makeAnswerKeySecret } from "../lib/exam";
import { AnswerKeyEntry, CollectedResult, Question } from "../lib/schema";
import { useTeacher } from "../teacher/teacherContext";

export function ResultDetailPage() {
  const { id = "", rid = "" } = useParams();
  const { exams, setSelectedExamId } = useTeacher();
  const exam = exams.find((item) => item.id === id);
  const resultItem = exam?.results.find(
    (item) => item.result.rid === decodeURIComponent(rid),
  );

  useEffect(() => {
    if (exam) setSelectedExamId(exam.id);
  }, [exam, setSelectedExamId]);

  const answerKey = useMemo(() => {
    if (!exam) return [];
    return revealAnswerKey(
      exam.payload.ak,
      makeAnswerKeySecret(exam.payload.eid, exam.payload.sch),
    );
  }, [exam]);

  if (!exam || !resultItem) {
    return (
      <section className="card text-center">
        <h2 className="text-xl font-bold text-ink">Detail hasil tidak ditemukan</h2>
        <Link className="btn btn-primary mt-4" to={exam ? `/recap/${exam.id}` : "/"}>
          Kembali
        </Link>
      </section>
    );
  }

  const percentage = formatPercentage(resultItem.score);

  return (
    <section className="flex flex-col gap-5">
      <div className="card">
        <div className="mb-4 flex flex-wrap items-start justify-between gap-4">
          <SectionTitle
            description={`${exam.payload.ttl || "Ujian"} - ${exam.payload.subj || "-"} - ${exam.payload.cls || "-"}`}
            title={`Detail Hasil: ${resultItem.result.stu.name || "-"}`}
          />
          <div className="flex flex-wrap gap-2">
            <Link className="btn btn-secondary" to={`/collect/${exam.id}`}>
              <ArrowLeft size={16} />
              Kumpulkan
            </Link>
            <Link className="btn btn-primary" to={`/recap/${exam.id}`}>
              Rekap
            </Link>
          </div>
        </div>

        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <Metric label="Nilai" value={percentage} />
          <Metric
            label="Poin"
            value={`${resultItem.score.score}/${resultItem.score.maxScore}`}
          />
          <Metric
            label="Benar"
            value={`${resultItem.score.correct}/${resultItem.score.totalQuestions}`}
          />
          <Metric label="Status" value={resultItem.status} />
        </div>

        <div className="mt-4 grid gap-3 text-sm text-muted sm:grid-cols-2 lg:grid-cols-4">
          <p>
            <span className="font-semibold text-ink">ID/NIS:</span>{" "}
            {resultItem.result.stu.sid || "-"}
          </p>
          <p>
            <span className="font-semibold text-ink">Kelas:</span>{" "}
            {resultItem.result.stu.cls || "-"}
          </p>
          <p>
            <span className="font-semibold text-ink">Submit:</span>{" "}
            {new Date(resultItem.result.sub).toLocaleString("id-ID")}
          </p>
          <p>
            <span className="font-semibold text-ink">Result ID:</span>{" "}
            {resultItem.result.rid}
          </p>
        </div>
      </div>

      <AnswerBreakdown
        answerKey={answerKey}
        questions={exam.payload.qs}
        resultItem={resultItem}
      />
    </section>
  );
}

function AnswerBreakdown({
  answerKey,
  questions,
  resultItem,
}: {
  answerKey: AnswerKeyEntry[];
  questions: Question[];
  resultItem: CollectedResult;
}) {
  const keyByQuestion = new Map(answerKey.map((entry) => [entry.qid, entry.oid]));

  return (
    <div className="card">
      <SectionTitle
        description="Periksa jawaban siswa, kunci benar, dan status tiap soal."
        title="Rincian Jawaban"
      />
      <div className="mt-4 flex flex-col gap-3">
        {questions.map((question, index) => {
          const correctOptionId = keyByQuestion.get(question.id) || "";
          const studentOptionId = resultItem.result.ans[question.id] || "";
          const isCorrect = studentOptionId === correctOptionId;

          return (
            <article
              className="rounded-lg border border-line bg-white p-4"
              key={question.id}
            >
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <p className="text-xs font-bold uppercase text-muted">
                    Soal {index + 1} - {question.pts} poin
                  </p>
                  <h3 className="mt-1 font-bold leading-6 text-ink">
                    {question.txt}
                  </h3>
                </div>
                <span
                  className={[
                    "inline-flex rounded-full px-3 py-1 text-xs font-bold",
                    isCorrect
                      ? "bg-green-50 text-green-700"
                      : "bg-red-50 text-red-700",
                  ].join(" ")}
                >
                  {isCorrect ? "Benar" : "Salah"}
                </span>
              </div>

              <OptionList
                correctOptionId={correctOptionId}
                question={question}
                studentOptionId={studentOptionId}
              />
            </article>
          );
        })}
      </div>
    </div>
  );
}

function OptionList({
  correctOptionId,
  question,
  studentOptionId,
}: {
  correctOptionId: string;
  question: Question;
  studentOptionId: string;
}) {
  return (
    <div className="mt-4 flex flex-col gap-2">
      {question.opts.map((option, optionIndex) => {
        const isCorrectOption = option.id === correctOptionId;
        const isStudentChoice = option.id === studentOptionId;
        const isWrongChoice = isStudentChoice && !isCorrectOption;

        return (
          <div
            className={[
              "flex items-start gap-3 rounded-md border px-3 py-3 text-sm",
              isCorrectOption
                ? "border-green-200 bg-green-50 text-green-900"
                : isWrongChoice
                  ? "border-red-200 bg-red-50 text-red-900"
                  : "border-line bg-slate-50 text-ink",
            ].join(" ")}
            key={option.id}
          >
            <span
              className={[
                "flex h-7 w-7 shrink-0 items-center justify-center rounded-full border text-xs font-bold uppercase",
                isCorrectOption
                  ? "border-green-300 bg-green-600 text-white"
                  : isWrongChoice
                    ? "border-red-300 bg-white text-red-700"
                    : "border-line bg-white text-muted",
              ].join(" ")}
            >
              {formatOptionLabel(optionIndex)}
            </span>
            <div className="min-w-0 flex-1">
              <p className="font-semibold leading-6">{option.txt}</p>
              <div className="mt-2 flex flex-wrap gap-2">
                {isCorrectOption ? (
                  <span className="inline-flex items-center gap-1 rounded-full bg-green-600 px-2.5 py-1 text-xs font-bold text-white">
                    <Check size={13} />
                    Jawaban benar
                  </span>
                ) : null}
                {isStudentChoice ? (
                  <span
                    className={[
                      "inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-bold",
                      isCorrectOption
                        ? "bg-green-100 text-green-800"
                        : "bg-red-100 text-red-800",
                    ].join(" ")}
                  >
                    <UserRound size={13} />
                    Pilihan siswa
                  </span>
                ) : null}
              </div>
            </div>
          </div>
        );
      })}
      {!studentOptionId ? (
        <p className="rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-sm font-semibold text-amber-800">
          Siswa tidak menjawab soal ini.
        </p>
      ) : null}
    </div>
  );
}

function formatPercentage(score: CollectedResult["score"]) {
  return `${score.percentage.toLocaleString("id-ID", {
    maximumFractionDigits: 2,
  })}%`;
}

function formatOptionLabel(index: number) {
  if (index < 0) return "-";
  return String.fromCharCode(97 + index);
}
