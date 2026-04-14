import { describe, expect, test } from "vitest";
import { createDefaultMastery, updateMastery } from "./mastery";

describe("mastery", () => {
  test("wrong and timeout increase priority for repetition", () => {
    const base = createDefaultMastery("6-7-42");
    const wrong = updateMastery(base, "wrong");
    const timeout = updateMastery(base, "timeout");

    expect(wrong.nextPriority).toBeGreaterThan(base.nextPriority);
    expect(timeout.nextPriority).toBeGreaterThan(wrong.nextPriority - 0.5);
    expect(timeout.confidence).toBeLessThan(base.confidence);
  });

  test("slow answer does not behave like stable knowledge", () => {
    const base = createDefaultMastery("3-4-12");
    const slow = updateMastery(base, "slow");

    expect(slow.slowCount).toBe(1);
    expect(slow.nextPriority).toBeGreaterThan(base.nextPriority);
    expect(slow.confidence).toBeLessThanOrEqual(base.confidence);
  });
});
