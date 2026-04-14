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
  | "promptId"
> => {
  if (promptType === "multiply") {
    return {
      text: `${family.a} × ${family.b}`,
      spokenText: `${family.a} умножить на ${family.b}`,
      correctAnswer: family.product,
      revealText: `${family.a} × ${family.b} = ${family.product}`,
      spokenRevealText: `${family.a} умножить на ${family.b} равно ${family.product}`,
      promptId: `${family.id}:multiply`
    };
  }

  if (promptType === "divideByA") {
    return {
      text: `${family.product} ÷ ${family.a}`,
      spokenText: `${family.product} разделить на ${family.a}`,
      correctAnswer: family.b,
      revealText: `${family.product} ÷ ${family.a} = ${family.b}`,
      spokenRevealText: `${family.product} разделить на ${family.a} равно ${family.b}`,
      promptId: `${family.id}:divideByA`
    };
  }

  return {
    text: `${family.product} ÷ ${family.b}`,
    spokenText: `${family.product} разделить на ${family.b}`,
    correctAnswer: family.a,
    revealText: `${family.product} ÷ ${family.b} = ${family.a}`,
    spokenRevealText: `${family.product} разделить на ${family.b} равно ${family.a}`,
    promptId: `${family.id}:divideByB`
  };
};
