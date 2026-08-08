export const DEMO_USERS = {
  teacher: { username: "teacher", password: "demo1234", label: "李老师", path: "/teacher" },
  student: { username: "student", password: "demo1234", label: "张小禾", path: "/student" },
  parent: { username: "parent", password: "demo1234", label: "张妈妈", path: "/parent" },
} as const;

export const DEMO_IDS = {
  school: "school-qinghe",
  class: "class-five-one",
  teacher: "user-teacher-li",
  student: "user-student-zhang",
  parent: "user-parent-zhang",
} as const;

export type UserRole = keyof typeof DEMO_USERS;

export const ROLE_LABELS: Record<UserRole, string> = {
  teacher: "教师端",
  student: "学生端",
  parent: "家长端",
};
