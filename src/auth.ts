import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import { compare } from "bcryptjs";
import { z } from "zod";

import { getUserByUsername } from "@/lib/db";

export const { handlers, auth, signIn, signOut } = NextAuth({
  trustHost: true,
  pages: { signIn: "/login" },
  session: { strategy: "jwt", maxAge: 7 * 24 * 60 * 60 },
  providers: [
    Credentials({
      credentials: {
        username: { label: "账号", type: "text" },
        password: { label: "密码", type: "password" },
      },
      async authorize(credentials) {
        const parsed = z.object({ username: z.string().min(1), password: z.string().min(8) }).safeParse(credentials);
        if (!parsed.success) return null;
        const user = await getUserByUsername(parsed.data.username);
        if (!user || !(await compare(parsed.data.password, user.passwordHash))) return null;
        return { id: user.id, name: user.name, role: user.role, schoolId: user.schoolId };
      },
    }),
  ],
  callbacks: {
    jwt({ token, user }) {
      if (user) {
        token.role = user.role;
        token.schoolId = user.schoolId;
      }
      return token;
    },
    session({ session, token }) {
      if (session.user) {
        session.user.id = token.sub ?? "";
        session.user.role = token.role;
        session.user.schoolId = token.schoolId;
      }
      return session;
    },
  },
});
