import type { UserRole } from "@/lib/constants";

export type MessageChannel = "class" | "student_teacher" | "parent_teacher";

export function canUseMessageChannel(role: UserRole, channel: MessageChannel) {
  if (role === "teacher") return true;
  if (role === "student") return channel === "class" || channel === "student_teacher";
  return channel === "parent_teacher";
}
