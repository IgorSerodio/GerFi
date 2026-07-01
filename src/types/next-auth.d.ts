import { DefaultSession, DefaultUser } from "next-auth";

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      role: string;
      guiche: string | null;
      username: string;
    } & DefaultSession["user"];
  }

  interface User extends DefaultUser {
    role: string;
    guiche: string | null;
    username: string;
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    role: string;
    guiche: string | null;
    username: string;
  }
}
