import { MessageBoard } from "@/components/message-board";
import { PageHeader } from "@/components/page-header";
import { getParentData } from "@/lib/data";
import { requireSession } from "@/lib/dal";
import { DEMO_IDS } from "@/lib/constants";

export default async function MessagesPage() { const session = await requireSession("parent"); const data = await getParentData(session.user.id); if (!data) return null; return <main className="page-wrap"><PageHeader title="联系老师" description="给李老师异步留言；涉及连续沟通时可先预约方便的时间" /><div className="mx-auto max-w-3xl"><MessageBoard initialMessages={data.messages} currentUserId={session.user.id} channel="parent_teacher" receiverId={DEMO_IDS.teacher} /></div></main>; }
