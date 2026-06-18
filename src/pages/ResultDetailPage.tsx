import { ArrowLeft } from "lucide-react";
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
          const correctOption = question.opts.find(
            (option) => option.id === correctOptionId,
          );
          const studentOption = question.opts.find(
            (option) => option.id === studentOptionId,
          );

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

              <div className="mt-4 grid gap-3 md:grid-cols-2">
                <AnswerCard
                  label="Jawaban siswa"
                  option={studentOption}
                  optionId={studentOptionId}
                  questions={question}
                />
                <AnswerCard
                  label="Kunci benar"
                  option={correctOption}
                  optionId={correctOptionId}
                  questions={question}
                />
              </div>
            </article>
          );
        })}
      </div>
    </div>
  );
}

function AnswerCard({
  label,
  option,
  optionId,
  questions,
}: {
  label: string;
  option?: Question["opts"][number];
  optionId: string;
  questions: Question;
}) {
  const optionIndex = questions.opts.findIndex((item) => item.id === optionId);

  return (
    <div className="rounded-md border border-line bg-slate-50 p-3">
      <p className="text-xs font-bold uppercase text-muted">{label}</p>
      <p className="mt-1 text-sm font-semibold text-ink">
        {option
          ? `${formatOptionLabel(optionIndex)}. ${option.txt}`
          : "Tidak dijawab"}
      </p>
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
