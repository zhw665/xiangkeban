import "server-only";

import { parseOffice } from "officeparser";

export async function extractFileText(file: File) {
  const buffer = Buffer.from(await file.arrayBuffer());
  if (file.type === "text/plain") return buffer.toString("utf8").trim();
  if (file.type.startsWith("image/")) return "";
  try {
    const ast = await parseOffice(buffer, { ocr: false });
    const result = await ast.to("text");
    return String(result.value ?? "").replace(/\s+/g, " ").trim();
  } catch {
    return "";
  }
}

export function chunkText(text: string, maxLength = 900) {
  const normalized = text.replace(/\r/g, "").trim();
  if (!normalized) return [];
  const parts = normalized.split(/(?<=[。！？\n])/).map((part) => part.trim()).filter(Boolean);
  const chunks: string[] = [];
  let current = "";
  for (const part of parts) {
    if (current && current.length + part.length > maxLength) {
      chunks.push(current);
      current = part;
    } else current += part;
  }
  if (current) chunks.push(current);
  return chunks.slice(0, 80);
}
