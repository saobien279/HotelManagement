import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import { readDB } from "./db";
import crypto from "crypto";
import { authConfig } from "./auth.config";

export const { handlers, auth, signIn, signOut } = NextAuth({
  ...authConfig,
  providers: [
    Credentials({
      name: "Credentials",
      credentials: {
        username: { label: "Username", type: "text" },
        password: { label: "Password", type: "password" }
      },
      authorize: async (credentials) => {
        if (!credentials?.username || !credentials?.password) return null;
        
        const db = await readDB();
        const user = db.users.find(u => u.username === credentials.username && u.status === 'active');
        if (!user || !user.password) return null;
        
        const hash = crypto.createHash('sha256').update(credentials.password as string).digest('hex');
        if (hash === user.password) {
          return {
            id: user.id,
            name: user.name,
            username: user.username,
            role: user.role
          };
        }
        return null;
      }
    })
  ]
});
