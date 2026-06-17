import NextAuth, { AuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import { pool } from "@/infra/database";
import bcrypt from "bcryptjs";

export const authOptions: AuthOptions = {
  providers: [
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        username: { label: "Username", type: "text" },
        password: { label: "Password", type: "password" }
      },
      async authorize(credentials) {
        if (!credentials?.username || !credentials?.password) {
          throw new Error("Credenciais não informadas.");
        }

        const res = await pool.query("SELECT * FROM users WHERE username = $1 LIMIT 1", [
          credentials.username,
        ]);

        if (res.rows.length === 0) {
          throw new Error("Usuário ou senha incorretos.");
        }

        const user = res.rows[0];

        if (user.blocked) {
          throw new Error("Este usuário está bloqueado.");
        }

        const isValid = bcrypt.compareSync(credentials.password, user.password);
        if (!isValid) {
          throw new Error("Usuário ou senha incorretos.");
        }

        return {
          id: String(user.id),
          name: user.name,
          email: user.email,
          role: user.role,
          guiche: user.guiche,
          username: user.username,
          services: user.services || [],
        };
      }
    })
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.role = user.role;
        token.guiche = user.guiche;
        token.username = user.username;
        token.services = user.services;
      }
      return token;
    },
    async session({ session, token }) {
      if (token && session.user) {
        session.user.id = token.sub || "";
        session.user.role = token.role;
        session.user.guiche = token.guiche;
        session.user.username = token.username;
        session.user.services = token.services;
      }
      return session;
    }
  },
  pages: {
    signIn: "/",
  },
  session: {
    strategy: "jwt",
  },
  secret: process.env.NEXTAUTH_SECRET,
};

const handler = NextAuth(authOptions);
export { handler as GET, handler as POST };
