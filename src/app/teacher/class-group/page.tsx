import { ClassGroupView } from "@/components/class-group-view";
import { PageHeader } from "@/components/page-header";
import { getTeacherData } from "@/lib/data";
import { requireSession } from "@/lib/dal";

export default async function ClassGroupPage() { const session = await requireSession("teacher"); const data = await getTeacherData(session.user.id); if (!data) return null; const groupMessages = data.messages.filter((item) => item.channel === "class"); const privateMessages = data.messages.filter((item) => item.channel === "student_teacher"); const members = [{ id: session.user.id, name: session.user.name ?? "李晓云", role: "teacher" as const }, ...data.students.map((student) => ({ ...student, role: "student" as const }))]; return <main className="page-wrap"><PageHeader title="班级群" description="集中发布公告、学习资源和公开答疑，也可以从群成员中发起师生私聊" /><ClassGroupView posts={data.posts ?? []} initialMessages={groupMessages} initialPrivateMessages={privateMessages} members={members} currentUserId={session.user.id} role="teacher" /></main>; }
