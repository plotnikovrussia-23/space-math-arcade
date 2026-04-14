import { PLANET_BY_ID, getPlanetIndex } from "../config/planets";
import type {
  FactFamily,
  FactMastery,
  GameMode,
  PlanetId,
  PromptType,
  Question,
  QuestionDifficulty
} from "../types";
import { formatPrompt, getFamiliesForMode } from "./facts";
import { createDefaultMastery, getMasteryWeight } from "./mastery";

const TIER_BY_INDEX: QuestionDifficulty[] = [
  "warmup",
  "warmup",
  "warmup",
  "mid",
  "mid",
  "mid",
  "mid",
  "tense",
  "tense",
  "boss"
];

const shuffle = <T,>(items: T[]) => {
  const copy = [...items];

  for (let index = copy.length - 1; index > 0; index -= 1) {
    const swapIndex = Math.floor(Math.random() * (index + 1));
    [copy[index], copy[swapIndex]] = [copy[swapIndex], copy[index]];
  }

  return copy;
};

const chooseWeighted = <T,>(items: T[], weightFor: (item: T) => number) => {
  const total = items.reduce((sum, item) => sum + weightFor(item), 0);
  let roll = Math.random() * total;

  for (const item of items) {
    roll -= weightFor(item);

    if (roll <= 0) {
      return item;
    }
  }

  return items[items.length - 1];
};

const promptTypesForTier = (
  tier: QuestionDifficulty,
  family: FactFamily,
  planetIndex: number
): PromptType[] => {
  if (tier === "warmup") {
    return ["multiply", "multiply", "divideByA"];
  }

  if (tier === "mid") {
    return family.a === family.b
      ? ["multiply", "divideByA"]
      : ["multiply", "divideByA", "divideByB"];
  }

  if (tier === "tense" || tier === "boss") {
    return planetIndex >= 3
      ? ["divideByA", "divideByB", "multiply"]
      : ["multiply", "divideByA", "divideByB"];
  }

  return ["multiply"];
};

const getFamilyDifficultyScore = (family: FactFamily) =>
  family.product / 10 + Math.max(family.a, family.b) / 4;

const getTierMultiplier = (
  family: FactFamily,
  tier: QuestionDifficulty,
  planetIndex: number
) => {
  const score = getFamilyDifficultyScore(family);

  if (tier === "warmup") {
    return score <= 3.2 ? 1.35 : 0.7;
  }

  if (tier === "mid") {
    return score <= 6 ? 1.18 : 0.95;
  }

  if (tier === "tense") {
    return 0.9 + score / 8 + planetIndex * 0.03;
  }

  return 1.1 + score / 6 + planetIndex * 0.05;
};

const buildDistractors = (family: FactFamily, correctAnswer: number) => {
  const candidates = new Set<number>([
    correctAnswer - 1,
    correctAnswer + 1,
    correctAnswer - 2,
    correctAnswer + 2,
    correctAnswer + family.a,
    correctAnswer + family.b,
    Math.abs(correctAnswer - family.a),
    Math.abs(correctAnswer - family.b),
    family.a + family.b,
    Math.abs(family.a - family.b),
    Math.round(family.product / Math.max(family.a, family.b)) + 1
  ]);

  candidates.delete(correctAnswer);

  const filtered = [...candidates].filter((value) => value > 0 && value <= 81);

  while (filtered.length < 3) {
    const candidate = Math.max(
      1,
      Math.min(81, correctAnswer + Math.floor(Math.random() * 7) - 3)
    );

    if (candidate !== correctAnswer && !filtered.includes(candidate)) {
      filtered.push(candidate);
    }
  }

  return shuffle([correctAnswer, ...filtered.slice(0, 3)]);
};

export const generateMissionQuestions = ({
  mode,
  planetId,
  masteryMap,
  count = 10,
  recentPromptIds = []
}: {
  mode: GameMode;
  planetId: PlanetId;
  masteryMap: Record<string, FactMastery>;
  count?: number;
  recentPromptIds?: string[];
}): Question[] => {
  const families = getFamiliesForMode(mode);
  const planet = PLANET_BY_ID[planetId];
  const planetIndex = getPlanetIndex(planetId);
  const recentLocal: string[] = [...recentPromptIds];
  const questions: Question[] = [];

  for (let index = 0; index < count; index += 1) {
    const tier = TIER_BY_INDEX[index] ?? "mid";
    const family = chooseWeighted(families, (candidate) => {
      const mastery =
        masteryMap[candidate.id] ?? createDefaultMastery(candidate.id);

      let weight =
        getMasteryWeight(mastery) *
        getTierMultiplier(candidate, tier, planetIndex);

      if (
        questions.some((question) => question.familyId === candidate.id) &&
        mastery.nextPriority < 3
      ) {
        weight *= 0.48;
      }

      return Math.max(0.2, weight);
    });

    const promptTypeChoices = promptTypesForTier(tier, family, planetIndex);
    const promptType = chooseWeighted(promptTypeChoices, (candidate) => {
      const promptId = `${family.id}:${candidate}`;
      return recentLocal.includes(promptId) ? 0.25 : 1;
    });
    const prompt = formatPrompt(family, promptType);

    recentLocal.push(prompt.promptId);
    if (recentLocal.length > 5) {
      recentLocal.shift();
    }

    questions.push({
      id: `${family.id}-${planet.id}-${index}-${Math.random().toString(16).slice(2, 8)}`,
      familyId: family.id,
      promptId: prompt.promptId,
      promptType,
      text: prompt.text,
      spokenText: prompt.spokenText,
      revealText: prompt.revealText,
      spokenRevealText: prompt.spokenRevealText,
      correctAnswer: prompt.correctAnswer,
      options: buildDistractors(family, prompt.correctAnswer),
      planetId,
      difficultyTier: tier
    });
  }

  return questions;
};
