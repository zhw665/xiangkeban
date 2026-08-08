import { PageHeader } from "@/components/page-header";
import { TeacherMessagesView } from "@/components/teacher-messages-view";
import { getTeacherData, getTeacherGuardianContacts } from "@/lib/data";
import { requireSession } from "@/lib/dal";

export default async function MessagesPage() { const session = await requireSession("teacher"); const [data, contacts] = await Promise.all([getTeacherData(session.user.id), getTeacherGuardianContacts(session.user.id)]); if (!data) return null; const messages = data.messages.filter((item) => item.channel === "parent_teacher"); return <main className="page-wrap"><PageHeader title="家校沟通" description="从左侧通讯录选择家长，在右侧进行异步沟通" /><TeacherMessagesView contacts={contacts} messages={messages} currentUserId={session.user.id} /></main>; }
