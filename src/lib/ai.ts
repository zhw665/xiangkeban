import "server-only";

import { z } from "zod";

const materialAnalysisSchema = z.object({
  summary: z.string().min(10),
  objectives: z.array(z.string()).min(2).max(5),
  outline: z.array(z.string()).min(3).max(8),
  exercises: z.array(z.string()).min(2).max(6),
});

const questionAnalysisSchema = z.object({
  category: z.string(),
  knowledgePoint: z.string(),
  urgency: z.enum(["normal", "attention"]),
  hint: z.string(),
  draftAnswer: z.string(),
});

export type MaterialAnalysis = z.infer<typeof materialAnalysisSchema>;
export type QuestionAnalysis = z.infer<typeof questionAnalysisSchema>;

export interface AIProvider {
  analyzeMaterial(input: { title: string; subject: string; grade: string; text: string; notes: string }): Promise<MaterialAnalysis>;
  classifyQuestion(input: { content: string; subject: string; grade: string; context: string[] }): Promise<QuestionAnalysis>;
  generateWeeklyReport(input: { studentName: string; assignments: string; observations: string }): Promise<{ summary: string; accomplishments: string; needsHelp: string; familyActions: string }>;
  transcribeAudio(_data: Buffer): Promise<string>;
}

class DemoAIProvider implements AIProvider {
  async analyzeMaterial(input: { title: string; subject: string; grade: string; text: string; notes: string }) {
    const ruralContext = input.subject === "数学" ? "用分玉米、量梯田或赶集找零等生活情境导入" : "联系村庄四季、劳动经验与身边观察导入";
    return {
      summary: `${input.title}围绕${input.subject}核心知识展开，适合${input.grade}课堂使用。${input.text ? "已结合上传材料提取重点。" : "当前依据教师填写的主题生成。"}`,
      objectives: ["说清本课核心概念，并能用自己的话解释", "完成基础练习并说明思考过程", "把知识与一个身边生活情境联系起来"],
      outline: [`情境导入：${ruralContext}`, "教师示范：拆解一个典型问题", "同伴探究：两人一组说出判断依据", "课堂检测：完成两道即时练习", "回顾迁移：用一句话总结今天的发现"],
      exercises: ["基础题：判断核心概念的一个正例和反例", "表达题：用身边的物品或经历解释本课知识", "挑战题：改变一个条件，说明结果会怎样变化"],
    };
  }

  async classifyQuestion(input: { content: string; subject: string; grade: string; context: string[] }): Promise<QuestionAnalysis> {
    const isHelp = /害怕|欺负|不敢|难受|不想上学|需要帮助/.test(input.content);
    const fraction = /分数|分母|分子|四分之一|平均分/.test(input.content);
    return {
      category: isHelp ? "需要老师关注" : fraction ? "概念理解" : "课后疑问",
      knowledgePoint: fraction ? "平均分与分数意义" : `${input.subject}课堂知识`,
      urgency: isHelp ? "attention" : "normal",
      hint: fraction ? "先检查是不是“平均分”，再分别说说总份数和取了几份。" : "先写出题目里已经知道的条件，再圈出最不明白的一步。",
      draftAnswer: fraction ? "分数表示把一个整体平均分后所取的一份或几份。分母是平均分成的份数，分子是取出的份数；如果不是平均分，就不能直接这样表示。" : `可以先回到${input.grade}${input.subject}本课的例题，按“已知条件、要解决的问题、第一步”重新整理。${input.context[0] ? `教材中相关提示：${input.context[0].slice(0, 90)}` : "老师可以结合课堂例题补充说明。"}`,
    };
  }

  async generateWeeklyReport(input: { studentName: string; assignments: string; observations: string }) {
    return { summary: `${input.studentName}本周学习节奏稳定，能够按要求参与课堂和完成任务。`, accomplishments: input.assignments || "完成了本周主要学习任务。", needsHelp: "继续巩固薄弱知识点，并练习说出完整的思考过程。", familyActions: "每天留出10分钟，请孩子讲一件今天学会的事；先倾听，再追问“你是怎么想到的”。" };
  }

  async transcribeAudio(data: Buffer) { void data; return "这是一条语音消息，请老师播放原音查看。"; }
}

class DashScopeAIProvider implements AIProvider {
  private fallback = new DemoAIProvider();

  private async request<T>(system: string, prompt: string, schema: z.ZodType<T>, fallback: () => Promise<T>) {
    try {
      const response = await fetch(`${process.env.DASHSCOPE_BASE_URL ?? "https://dashscope.aliyuncs.com/compatible-mode/v1"}/chat/completions`, {
        method: "POST",
        headers: { Authorization: `Bearer ${process.env.DASHSCOPE_API_KEY}`, "Content-Type": "application/json" },
        body: JSON.stringify({ model: process.env.DASHSCOPE_TEXT_MODEL ?? "qwen3-max", temperature: 0.2, response_format: { type: "json_object" }, messages: [{ role: "system", content: system }, { role: "user", content: prompt }] }),
        signal: AbortSignal.timeout(18000),
      });
      if (!response.ok) throw new Error(`DashScope ${response.status}`);
      const payload = await response.json() as { choices?: { message?: { content?: string } }[] };
      const content = payload.choices?.[0]?.message?.content?.replace(/^```json\s*|\s*```$/g, "");
      if (!content) throw new Error("Empty AI response");
      return schema.parse(JSON.parse(content));
    } catch {
      return fallback();
    }
  }

  analyzeMaterial(input: { title: string; subject: string; grade: string; text: string; notes: string }) {
    return this.request("你是乡村学校备课助教。只输出JSON，字段为summary、objectives、outline、exercises。内容必须适龄、可执行并联系真实生活。", JSON.stringify({ ...input, text: input.text.slice(0, 12000) }), materialAnalysisSchema, () => this.fallback.analyzeMaterial(input));
  }

  classifyQuestion(input: { content: string; subject: string; grade: string; context: string[] }): Promise<QuestionAnalysis> {
    return this.request("你是课后答疑助教。只输出JSON，字段为category、knowledgePoint、urgency、hint、draftAnswer。hint只能启发，draftAnswer供教师审核。涉及安全、欺凌或明显情绪风险时urgency设为attention，不做心理诊断。", JSON.stringify(input), questionAnalysisSchema, () => this.fallback.classifyQuestion(input));
  }

  generateWeeklyReport(input: { studentName: string; assignments: string; observations: string }) {
    const schema = z.object({ summary: z.string(), accomplishments: z.string(), needsHelp: z.string(), familyActions: z.string() });
    return this.request("生成简洁、尊重、可执行的家长学情周报，只输出JSON。不得进行排名或心理诊断。", JSON.stringify(input), schema, () => this.fallback.generateWeeklyReport(input));
  }

  transcribeAudio(data: Buffer) { return this.fallback.transcribeAudio(data); }
}

export function getAIProvider(): AIProvider {
  return process.env.DASHSCOPE_API_KEY ? new DashScopeAIProvider() : new DemoAIProvider();
}

export function lessonPlanToText(analysis: MaterialAnalysis) {
  return [`教学目标`, ...analysis.objectives.map((item, index) => `${index + 1}. ${item}`), "", "课堂流程", ...analysis.outline.map((item, index) => `${index + 1}. ${item}`), "", "练习建议", ...analysis.exercises.map((item, index) => `${index + 1}. ${item}`)].join("\n");
}
