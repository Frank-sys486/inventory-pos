import NextAuth from "next-auth"
import { authConfig } from "./auth.config"
import Credentials from "next-auth/providers/credentials"
import { dbUsers } from "./lib/pouchdb"

export const { handlers, signIn, signOut, auth } = NextAuth({
  ...authConfig,
  session: { strategy: "jwt" }, // PouchDB doesn't use an adapter session
  providers: [
    Credentials({
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) return null;
        
        // 1. Check Master Admin from .env
        const adminEmail = process.env.ADMIN_EMAIL;
        const adminPassword = process.env.ADMIN_PASSWORD;

        if (adminEmail && adminPassword && 
            credentials.email === adminEmail && 
            credentials.password === adminPassword) {
          return {
            id: "admin-master",
            email: adminEmail,
            name: "Master Admin",
          };
        }

        // 2. Check PouchDB Users
        try {
          const result = await dbUsers.find({
            selector: { email: credentials.email }
          });

          const user: any = result.docs[0];

          if (user && user.password === credentials.password) {
            return {
              id: user._id,
              email: user.email,
              name: user.name,
            };
          }
        } catch (error) {
          console.error("Auth PouchDB error:", error);
        }
        
        return null;
      }
    })
  ]
})
