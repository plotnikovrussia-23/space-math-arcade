import type { FactMastery, SpeedClass } from "../types";

const clamp = (value: number, min: number, max: number) =>
  Math.min(max, Math.max(min, value));

export const createDefaultMastery = (familyId: string): FactMastery => ({
  familyId,
  confidence: 0.08,
  lastSpeedClass: null,
  mistakes: 0,
  slowCount: 0,
  seenCount: 0,
  nextPriority: 1
});

export const updateMastery = (
  previous: FactMastery,
  result: SpeedClass
): FactMastery => {
  const next = {
    ...previous,
    seenCount: previous.seenCount + 1,
    lastSpeedClass: result
  };

  switch (result) {
    case "instant":
      next.confidence = clamp(previous.confidence + 0.24, 0, 1.2);
      next.nextPriority = clamp(previous.nextPriority - 0.8, 0, 5);
      return next;
    case "good":
      next.confidence = clamp(previous.confidence + 0.16, 0, 1.2);
      next.nextPriority = clamp(previous.nextPriority - 0.45, 0, 5);
      return next;
    case "slow":
      next.confidence = clamp(previous.confidence - 0.03, 0, 1.2);
      next.slowCount = previous.slowCount + 1;
      next.nextPriority = clamp(previous.nextPriority + 1.15, 0, 6);
      return next;
    case "wrong":
      next.confidence = clamp(previous.confidence - 0.26, 0, 1.2);
      next.mistakes = previous.mistakes + 1;
      next.nextPriority = clamp(previous.nextPriority + 2.2, 0, 7);
      return next;
    case "timeout":
      next.confidence = clamp(previous.confidence - 0.3, 0, 1.2);
      next.mistakes = previous.mistakes + 1;
      next.slowCount = previous.slowCount + 1;
      next.nextPriority = clamp(previous.nextPriority + 2.5, 0, 7);
      return next;
    default:
      return next;
  }
};

export const getMasteryWeight = (mastery: FactMastery) =>
  1.2 +
  (1.15 - mastery.confidence) * 2.4 +
  mastery.nextPriority +
  mastery.mistakes * 0.35 +
  mastery.slowCount * 0.22;
