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

        const agora = new Date();
        if (user.locked_until && new Date(user.locked_until) > agora) {
          const waitTime = Math.ceil((new Date(user.locked_until).getTime() - agora.getTime()) / 60000);
          throw new Error(`Conta bloqueada temporariamente por excesso de tentativas. Tente novamente em ${waitTime} minuto(s).`);
        }

        const isValid = bcrypt.compareSync(credentials.password, user.password);
        if (!isValid) {
          const failedAttempts = (user.failed_login_attempts || 0) + 1;
          let lockMinutes = 0;
          
          if (failedAttempts >= 10) lockMinutes = 60;
          else if (failedAttempts >= 7) lockMinutes = 15;
          else if (failedAttempts >= 5) lockMinutes = 5;
          else if (failedAttempts >= 3) lockMinutes = 1;

          let lockedUntil = null;
          if (lockMinutes > 0) {
            lockedUntil = new Date(agora.getTime() + lockMinutes * 60000);
          }

          await pool.query(
            "UPDATE users SET failed_login_attempts = $1, locked_until = $2 WHERE id = $3",
            [failedAttempts, lockedUntil, user.id]
          );

          throw new Error("Usuário ou senha incorretos.");
        }

        if (user.failed_login_attempts > 0 || user.locked_until) {
          await pool.query(
            "UPDATE users SET failed_login_attempts = 0, locked_until = NULL WHERE id = $1",
            [user.id]
          );
        }

        return {
          id: String(user.id),
          name: user.name,
          email: user.email,
          role: user.role,
          guiche: user.guiche,
          username: user.username,
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
      }
      return token;
    },
    async session({ session, token }) {
      if (token && session.user) {
        session.user.id = token.sub || "";
        session.user.role = token.role;
        session.user.guiche = token.guiche;
        session.user.username = token.username;
      }
      return session;
    }
  },
  pages: {
    signIn: "/login",
  },
  session: {
    strategy: "jwt",
  },
  secret: process.env.NEXTAUTH_SECRET,
};

const handler = NextAuth(authOptions);
export { handler as GET, handler as POST };
