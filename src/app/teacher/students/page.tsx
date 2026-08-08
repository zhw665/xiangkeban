import { PageHeader } from "@/components/page-header";
import { StudentDirectoryView } from "@/components/student-directory-view";
import { getTeacherData } from "@/lib/data";
import { requireSession } from "@/lib/dal";

export default async function StudentsPage() { const session = await requireSession("teacher"); const data = await getTeacherData(session.user.id); if (!data) return null; return <main className="page-wrap"><PageHeader title="学生档案" description="从左侧学生名单切换档案，记录具体进步与需要支持的地方" /><StudentDirectoryView students={data.students} observations={data.observations} /></main>; }
