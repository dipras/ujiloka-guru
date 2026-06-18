import { AnswerKeyEntry, Question } from "./schema";

export const MIN_OPTIONS_PER_QUESTION = 2;
export const MAX_OPTIONS_PER_QUESTION = 10;

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

export function makeOptionId(index: number) {
  return String.fromCharCode(97 + index);
}

export function makeOptionIds(count: number) {
  return Array.from({ length: count }, (_, index) => makeOptionId(index));
}

export function makeQuestion(index: number): Question {
  const qid = `q${index}`;
  return {
    id: qid,
    txt: "",
    pts: 10,
    opts: makeOptionIds(4).map((id) => ({
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

export function makeSampleDraft(): ExamDraft {
  const samples = [
    {
      txt: "Hasil dari 12 + 8 adalah...",
      opts: ["18", "20", "22", "24"],
      answer: "b",
    },
    {
      txt: "Ibu kota Indonesia saat ini adalah...",
      opts: ["Bandung", "Surabaya", "Jakarta", "Medan"],
      answer: "c",
    },
    {
      txt: "Planet yang dikenal sebagai planet merah adalah...",
      opts: ["Venus", "Mars", "Jupiter", "Saturnus"],
      answer: "b",
    },
    {
      txt: "Satuan utama arus listrik adalah...",
      opts: ["Volt", "Ampere", "Ohm", "Watt"],
      answer: "b",
    },
    {
      txt: "Hasil dari 9 x 7 adalah...",
      opts: ["54", "56", "63", "72"],
      answer: "c",
    },
    {
      txt: "Bentuk negara Indonesia adalah...",
      opts: ["Kerajaan", "Republik", "Federasi", "Protektorat"],
      answer: "b",
    },
    {
      txt: "Proses tumbuhan membuat makanan disebut...",
      opts: ["Respirasi", "Fotosintesis", "Evaporasi", "Fermentasi"],
      answer: "b",
    },
    {
      txt: "Perangkat untuk memasukkan teks ke komputer adalah...",
      opts: ["Monitor", "Keyboard", "Speaker", "Printer"],
      answer: "b",
    },
    {
      txt: "Hasil dari 100 / 4 adalah...",
      opts: ["20", "25", "30", "40"],
      answer: "b",
    },
    {
      txt: "Bahasa pemrograman yang umum dipakai untuk web interaktif adalah...",
      opts: ["HTML", "CSS", "JavaScript", "SQL"],
      answer: "c",
    },
    {
      txt: "Lambang kimia air adalah...",
      opts: ["CO2", "H2O", "O2", "NaCl"],
      answer: "b",
    },
    {
      txt: "Pulau terluas di Indonesia adalah...",
      opts: ["Jawa", "Bali", "Kalimantan", "Madura"],
      answer: "c",
    },
    {
      txt: "Antonim dari kata 'besar' adalah...",
      opts: ["Tinggi", "Kecil", "Panjang", "Lebar"],
      answer: "b",
    },
    {
      txt: "Komponen komputer yang berfungsi memproses instruksi adalah...",
      opts: ["CPU", "Monitor", "Mouse", "Scanner"],
      answer: "a",
    },
    {
      txt: "Hasil dari 15% dari 200 adalah...",
      opts: ["20", "25", "30", "35"],
      answer: "c",
    },
    {
      txt: "Organ tubuh manusia yang memompa darah adalah...",
      opts: ["Paru-paru", "Jantung", "Ginjal", "Lambung"],
      answer: "b",
    },
    {
      txt: "Dokumen web biasanya ditulis dengan bahasa markup...",
      opts: ["HTML", "Python", "C++", "Java"],
      answer: "a",
    },
    {
      txt: "Sudut siku-siku besarnya...",
      opts: ["45 derajat", "60 derajat", "90 derajat", "180 derajat"],
      answer: "c",
    },
    {
      txt: "Alat untuk mengukur suhu adalah...",
      opts: ["Barometer", "Termometer", "Higrometer", "Anemometer"],
      answer: "b",
    },
    {
      txt: "Hewan yang berkembang biak dengan bertelur disebut...",
      opts: ["Vivipar", "Ovipar", "Ovovivipar", "Mamalia"],
      answer: "b",
    },
    {
      txt: "Pancasila memiliki jumlah sila sebanyak...",
      opts: ["3", "4", "5", "6"],
      answer: "c",
    },
    {
      txt: "File CSV umumnya memisahkan data dengan tanda...",
      opts: ["Koma", "Titik", "Garis miring", "Tanda tanya"],
      answer: "a",
    },
    {
      txt: "Hasil dari 2 pangkat 5 adalah...",
      opts: ["16", "24", "32", "64"],
      answer: "c",
    },
    {
      txt: "Sumber energi utama bagi bumi adalah...",
      opts: ["Bulan", "Matahari", "Angin", "Air"],
      answer: "b",
    },
    {
      txt: "Dalam ujian UjiLoka, skor final dihitung di...",
      opts: ["Perangkat siswa", "UjiLoka Guru", "Kamera", "QR hasil siswa"],
      answer: "b",
    },
  ];

  const qs = samples.map((sample, index) => ({
    id: `q${index + 1}`,
    txt: sample.txt,
    pts: 10,
    opts: makeOptionIds(sample.opts.length).map((id, optionIndex) => ({
      id,
      txt: sample.opts[optionIndex],
    })),
  }));

  return {
    eid: makeId("exam"),
    ttl: "Contoh Ujian 25 Soal",
    subj: "Simulasi",
    cls: "Demo",
    dur: 45,
    sch: makeSessionCode(),
    qs,
    ak: samples.map((sample, index) => ({
      qid: `q${index + 1}`,
      oid: sample.answer,
    })),
  };
}

export function normalizeDraft(draft: ExamDraft): ExamDraft {
  const questions = draft.qs.map((question, index) => {
    const id = question.id.trim() || `q${index + 1}`;
    const optionCount = Math.min(
      MAX_OPTIONS_PER_QUESTION,
      Math.max(MIN_OPTIONS_PER_QUESTION, question.opts.length),
    );
    const optionIds = makeOptionIds(optionCount);
    return {
      ...question,
      id,
      txt: question.txt.trim(),
      pts: Number.isFinite(question.pts) ? Math.max(0, question.pts) : 0,
      opts: optionIds.map((optionId, optionIndex) => ({
        id: optionId,
        txt: question.opts[optionIndex]?.txt.trim() || "",
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
    ak: questions.map((question, questionIndex) => {
      const draftQuestion = draft.qs[questionIndex];
      const existing = draft.ak.find(
        (entry) => entry.qid === question.id || entry.qid === draftQuestion?.id,
      );
      const oldOptionIndex = draftQuestion?.opts.findIndex(
        (option) => option.id === existing?.oid,
      );
      const mappedOption =
        typeof oldOptionIndex === "number" && oldOptionIndex >= 0
          ? question.opts[oldOptionIndex]
          : undefined;
      const validOption = question.opts.some((option) => option.id === existing?.oid);
      return {
        qid: question.id,
        oid: validOption
          ? existing!.oid
          : mappedOption?.id || question.opts[0]?.id || "",
      };
    }),
  };
}
