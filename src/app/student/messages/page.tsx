import { ClassGroupView } from "@/components/class-group-view";
import { PageHeader } from "@/components/page-header";
import { getStudentData } from "@/lib/data";
import { requireSession } from "@/lib/dal";

export default async function MessagesPage() { const session = await requireSession("student"); const data = await getStudentData(session.user.id); if (!data) return null; const groupMessages = data.messages.filter((message) => message.channel === "class"); const privateMessages = data.messages.filter((message) => message.channel === "student_teacher"); const members = data.members.filter((member) => member.role !== "parent").map((member) => ({ ...member, role: member.role as "teacher" | "student" })); return <main className="page-wrap"><PageHeader title="班级群" description="公告、学习资料和群消息与教师端同步，也可以从群成员中发起私聊" /><ClassGroupView posts={data.posts ?? []} initialMessages={groupMessages} initialPrivateMessages={privateMessages} members={members} currentUserId={session.user.id} role="student" /></main>; }
