import type { NextAuthConfig } from "next-auth";

export const authConfig = {
  providers: [], // Defined in auth.ts
  callbacks: {
    jwt({ token, user }) {
      if (user) {
        token.role = (user as any).role;
        token.username = (user as any).username;
      }
      return token;
    },
    session({ session, token }) {
      if (session.user) {
        (session.user as any).role = token.role as string;
        (session.user as any).username = token.username as string;
        (session.user as any).id = token.sub as string;
      }
      return session;
    }
  },
  pages: {
    signIn: "/login"
  },
  secret: process.env.AUTH_SECRET || "6f9a0c10-2b1b-4395-8856-4c47b59efd52",
  session: {
    strategy: "jwt",
    maxAge: 24 * 60 * 60, // 24 hours
  }
} satisfies NextAuthConfig;
