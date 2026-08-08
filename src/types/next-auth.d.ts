import "next-auth";
import "next-auth/jwt";

import type { UserRole } from "@/lib/constants";

declare module "next-auth" {
  interface User {
    role: UserRole;
    schoolId: string;
  }

  interface Session {
    user: {
      id: string;
      name?: string | null;
      role: UserRole;
      schoolId: string;
    };
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    role: UserRole;
    schoolId: string;
  }
}
