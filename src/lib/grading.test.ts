import { describe, expect, it } from "vitest";
import { gradeSubmission } from "@/lib/grading";

describe("gradeSubmission", () => {
  it("grades objective and tolerant short answers", () => {
    const result = gradeSubmission([
      { id: "one", type: "single", answer: "1/4", points: 40 },
      { id: "two", type: "short", answer: "平均分成的份数", points: 60 },
    ], { one: " 1/4 ", two: "分母表示平均分成的份数。" });
    expect(result.score).toBe(100);
    expect(result.missed).toEqual([]);
  });

  it("reports missed item ids", () => {
    expect(gradeSubmission([{ id: "one", type: "single", answer: "A", points: 100 }], { one: "B" })).toMatchObject({ score: 0, missed: ["one"] });
  });
});
