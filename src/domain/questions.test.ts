import { describe, expect, test } from "vitest";
import { generateMissionQuestions } from "./questions";

describe("generateMissionQuestions", () => {
  test("galactic mode includes both multiplication and division prompts", () => {
    const questions = generateMissionQuestions({
      mode: "galactic",
      planetId: "mars",
      masteryMap: {},
      count: 10
    });

    expect(questions).toHaveLength(10);
    expect(questions.some((question) => question.promptType === "multiply")).toBe(true);
    expect(questions.some((question) => question.promptType !== "multiply")).toBe(true);
  });

  test("each question has four plausible options including the correct answer", () => {
    const questions = generateMissionQuestions({
      mode: "firstFlight",
      planetId: "earth",
      masteryMap: {},
      count: 10
    });

    for (const question of questions) {
      expect(question.options).toHaveLength(4);
      expect(question.options).toContain(question.correctAnswer);
      expect(new Set(question.options).size).toBe(4);
    }
  });
});
