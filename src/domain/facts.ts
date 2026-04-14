import type { FactFamily, GameMode, PromptType } from "../types";

export const ALL_FACT_FAMILIES: FactFamily[] = [];

for (let a = 1; a <= 9; a += 1) {
  for (let b = a; b <= 9; b += 1) {
    const modeAvailability: GameMode[] = ["galactic"];

    if (a <= 5 || b <= 5) {
      modeAvailability.unshift("firstFlight");
    }

    ALL_FACT_FAMILIES.push({
      id: `${a}-${b}-${a * b}`,
      a,
      b,
      product: a * b,
      modeAvailability
    });
  }
}

export const getFamiliesForMode = (mode: GameMode) =>
  ALL_FACT_FAMILIES.filter((family) => family.modeAvailability.includes(mode));

const UNITS_RU = [
  "ноль",
  "один",
  "два",
  "три",
  "четыре",
  "пять",
  "шесть",
  "семь",
  "восемь",
  "девять"
];

const TEENS_RU = [
  "десять",
  "одиннадцать",
  "двенадцать",
  "тринадцать",
  "четырнадцать",
  "пятнадцать",
  "шестнадцать",
  "семнадцать",
  "восемнадцать",
  "девятнадцать"
];

const TENS_RU = [
  "",
  "",
  "двадцать",
  "тридцать",
  "сорок",
  "пятьдесят",
  "шестьдесят",
  "семьдесят",
  "восемьдесят",
  "девяносто"
];

const numberToWordsRu = (value: number) => {
  if (value < 10) {
    return UNITS_RU[value] ?? String(value);
  }

  if (value < 20) {
    return TEENS_RU[value - 10] ?? String(value);
  }

  if (value < 100) {
    const tens = Math.floor(value / 10);
    const units = value % 10;

    if (units === 0) {
      return TENS_RU[tens] ?? String(value);
    }

    return `${TENS_RU[tens]} ${UNITS_RU[units]}`;
  }

  return String(value);
};

export const formatPrompt = (
  family: FactFamily,
  promptType: PromptType
): Pick<
  import("../types").Question,
  | "text"
  | "spokenText"
  | "correctAnswer"
  | "revealText"
  | "spokenRevealText"
  | "spokenAnswerText"
  | "promptId"
> => {
  const aWords = numberToWordsRu(family.a);
  const bWords = numberToWordsRu(family.b);
  const productWords = numberToWordsRu(family.product);

  if (promptType === "multiply") {
    return {
      text: `${family.a} × ${family.b}`,
      spokenText: `${aWords} умножить на ${bWords}`,
      correctAnswer: family.product,
      revealText: `${family.a} × ${family.b} = ${family.product}`,
      spokenRevealText: `${aWords} умножить на ${bWords}. Равно ${productWords}. Ответ ${productWords}.`,
      spokenAnswerText: productWords,
      promptId: `${family.id}:multiply`
    };
  }

  if (promptType === "divideByA") {
    return {
      text: `${family.product} ÷ ${family.a}`,
      spokenText: `${productWords} разделить на ${aWords}`,
      correctAnswer: family.b,
      revealText: `${family.product} ÷ ${family.a} = ${family.b}`,
      spokenRevealText: `${productWords} разделить на ${aWords}. Равно ${bWords}. Ответ ${bWords}.`,
      spokenAnswerText: bWords,
      promptId: `${family.id}:divideByA`
    };
  }

  return {
    text: `${family.product} ÷ ${family.b}`,
    spokenText: `${productWords} разделить на ${bWords}`,
    correctAnswer: family.a,
    revealText: `${family.product} ÷ ${family.b} = ${family.a}`,
    spokenRevealText: `${productWords} разделить на ${bWords}. Равно ${aWords}. Ответ ${aWords}.`,
    spokenAnswerText: aWords,
    promptId: `${family.id}:divideByB`
  };
};
