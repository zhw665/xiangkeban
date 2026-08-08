import { describe, expect, it } from "vitest";
import { getAIProvider } from "@/lib/ai";

describe("AI fallback", () => {
  it("returns deterministic valid material analysis without an API key", async () => {
    const previous = process.env.DASHSCOPE_API_KEY; delete process.env.DASHSCOPE_API_KEY;
    const result = await getAIProvider().analyzeMaterial({ title: "分数", subject: "数学", grade: "五年级", text: "", notes: "" });
    expect(result.objectives.length).toBeGreaterThanOrEqual(2);
    expect(result.outline.join(" ")).toContain("玉米");
    if (previous) process.env.DASHSCOPE_API_KEY = previous;
  });
});
