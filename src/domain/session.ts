import { PLANET_BY_ID, PLANETS, getPlanetIndex } from "../config/planets";
import type {
  BattleSession,
  GameMode,
  PlanetId,
  QuestionOutcome,
  ResponseWindowLevel,
  ResultSummary,
  SpeedClass
} from "../types";
import { generateMissionQuestions } from "./questions";

export const MAX_SHIELD = 5;

export const RESPONSE_WINDOW_LEVELS: ResponseWindowLevel[] = [1, 2, 3, 4, 5, 6];

const RESPONSE_WINDOW_MULTIPLIER: Record<ResponseWindowLevel, number> = {
  1: 0.72,
  2: 0.86,
  3: 1,
  4: 1.18,
  5: 1.38,
  6: 1.62
};

export const QUESTION_TIME_LIMIT_MS = (
  planetId: PlanetId,
  responseWindowLevel: ResponseWindowLevel = 3
) =>
  Math.round(
    PLANET_BY_ID[planetId].questionTimeMs *
      RESPONSE_WINDOW_MULTIPLIER[responseWindowLevel]
  );

export const classifyResponse = (
  responseTimeMs: number,
  isCorrect: boolean
): SpeedClass => {
  if (!isCorrect) {
    return "wrong";
  }

  if (responseTimeMs <= 1000) {
    return "instant";
  }

  if (responseTimeMs <= 2000) {
    return "good";
  }

  if (responseTimeMs <= 3500) {
    return "slow";
  }

  return "timeout";
};

export const getWeaponLevel = (streak: number) => {
  if (streak >= 8) {
    return 3;
  }

  if (streak >= 5) {
    return 2;
  }

  if (streak >= 3) {
    return 1;
  }

  return 0;
};

export const getStreakLabel = (streak: number) => {
  if (streak >= 8) {
    return "МАКСИМУМ МОЩНОСТИ!";
  }

  if (streak >= 5) {
    return "УСИЛЕНИЕ!";
  }

  if (streak >= 3) {
    return "СЕРИЯ!";
  }

  return "";
};

export const createBattleSession = ({
  mode,
  planetId,
  masteryMap,
  recentPromptIds
}: {
  mode: GameMode;
  planetId: PlanetId;
  masteryMap: Record<string, import("../types").FactMastery>;
  recentPromptIds: string[];
}): BattleSession => ({
  mode,
  planetId,
  waveIndex: getPlanetIndex(planetId),
  shield: MAX_SHIELD,
  streak: 0,
  weaponLevel: 0,
  questions: generateMissionQuestions({
    mode,
    planetId,
    masteryMap,
    recentPromptIds
  }),
  currentQuestionIndex: 0,
  phase: "battleIntro",
  startedAt: Date.now(),
  questionStartedAt: Date.now(),
  currentOutcome: null,
  sessionStats: {
    destroyed: 0,
    wrong: 0,
    timedOut: 0,
    instant: 0,
    bestStreak: 0,
    difficultFacts: []
  }
});

export const getNextPlanetId = (planetId: PlanetId) => {
  const index = getPlanetIndex(planetId);
  return PLANETS[Math.min(index + 1, PLANETS.length - 1)].id;
};

export const buildResultSummary = (
  battle: BattleSession,
  success: boolean
): ResultSummary => ({
  success,
  planetId: battle.planetId,
  mode: battle.mode,
  shieldLeft: battle.shield,
  destroyed: battle.sessionStats.destroyed,
  bestStreak: battle.sessionStats.bestStreak,
  difficultFacts: battle.sessionStats.difficultFacts
});

export const createOutcome = ({
  questionId,
  familyId,
  status,
  responseTimeMs,
  selectedAnswer,
  streakBefore,
  streakAfter,
  shieldLost,
  revealText
}: {
  questionId: string;
  familyId: string;
  status: SpeedClass;
  responseTimeMs: number;
  selectedAnswer: number | null;
  streakBefore: number;
  streakAfter: number;
  shieldLost: number;
  revealText?: string;
}): QuestionOutcome => ({
  id: `${questionId}:${Date.now()}`,
  questionId,
  familyId,
  status,
  responseTimeMs,
  selectedAnswer,
  streakBefore,
  streakAfter,
  damageDealt: status === "wrong" || status === "timeout" ? 0 : 1,
  shieldLost,
  revealText
});
