export type GradeItem = { id: string; type: "single" | "short"; answer: string; points: number };

function normalize(value: string) {
  return value.trim().toLowerCase().replace(/[\s，。,.、]/g, "");
}

export function gradeSubmission(items: GradeItem[], answers: Record<string, string>) {
  let score = 0;
  const missed: string[] = [];
  for (const item of items) {
    const response = normalize(answers[item.id] ?? "");
    const expected = normalize(item.answer);
    const correct = item.type === "single" ? response === expected : response.includes(expected) || expected.includes(response) && response.length >= 3;
    if (correct) score += item.points;
    else missed.push(item.id);
  }
  return { score, missed, feedback: missed.length === 0 ? "完成得很扎实，继续保持清楚表达思路的习惯。" : `已自动批改客观内容，有 ${missed.length} 处需要回看知识点；老师可以继续补充评语。` };
}
