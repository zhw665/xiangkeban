import { eq } from "drizzle-orm";

import { files } from "@/db/schema";
import { jsonError } from "@/lib/api";
import { getApiSession, getClassContext } from "@/lib/dal";
import { db, dbReady } from "@/lib/db";
import { getStorageProvider } from "@/lib/storage";

export const runtime = "nodejs";

export async function GET(_request: Request, context: { params: Promise<{ id: string }> }) {
  const session = await getApiSession();
  if (!session) return jsonError("请先登录", 401);
  await dbReady;
  const { id } = await context.params;
  const file = await db.select().from(files).where(eq(files.id, id)).get();
  if (!file || file.schoolId !== session.user.schoolId) return jsonError("文件不存在", 404);
  if (file.classId) {
    const classroom = await getClassContext(session.user.id, session.user.role);
    if (classroom?.id !== file.classId) return jsonError("无权查看该文件", 403);
  }
  try {
    const buffer = await getStorageProvider().get(file.storageKey);
    const inline = file.mimeType.startsWith("video/") || file.mimeType.startsWith("audio/") || file.mimeType.startsWith("image/");
    return new Response(new Uint8Array(buffer), { headers: { "Content-Type": file.mimeType, "Content-Length": String(buffer.length), "Content-Disposition": `${inline ? "inline" : "attachment"}; filename*=UTF-8''${encodeURIComponent(file.name)}`, "Cache-Control": "private, max-age=300" } });
  } catch {
    return jsonError("文件读取失败", 404);
  }
}
