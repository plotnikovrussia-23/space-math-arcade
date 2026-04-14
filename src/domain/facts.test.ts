import { describe, expect, test } from "vitest";
import { formatPrompt, getFamiliesForMode } from "./facts";

describe("facts", () => {
  test("firstFlight excludes facts where both multipliers are above 5", () => {
    const ids = new Set(getFamiliesForMode("firstFlight").map((item) => item.id));

    expect(ids.has("7-8-56")).toBe(false);
    expect(ids.has("6-9-54")).toBe(false);
    expect(ids.has("4-8-32")).toBe(true);
  });

  test("division prompts are generated from the same family", () => {
    const family = getFamiliesForMode("galactic").find((item) => item.id === "6-7-42");

    expect(family).toBeDefined();
    expect(formatPrompt(family!, "divideByA")).toMatchObject({
      text: "42 ÷ 6",
      correctAnswer: 7,
      revealText: "42 ÷ 6 = 7",
      spokenRevealText: "42 разделить на 6 равно 7"
    });
    expect(formatPrompt(family!, "divideByB")).toMatchObject({
      text: "42 ÷ 7",
      correctAnswer: 6,
      revealText: "42 ÷ 7 = 6",
      spokenRevealText: "42 разделить на 7 равно 6"
    });
  });
});
