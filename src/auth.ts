import NextAuth from "next-auth"
import { authConfig } from "./auth.config"
import Credentials from "next-auth/providers/credentials"
import { dbUsers } from "./lib/pouchdb"

// CRITICAL: Force set AUTH_SECRET if missing to prevent MissingSecret error
if (!process.env.AUTH_SECRET) {
  process.env.AUTH_SECRET = "finopenpos-secure-fallback-secret-12345-abcde";
}

export const { handlers, signIn, signOut, auth } = NextAuth({
  ...authConfig,
  secret: process.env.AUTH_SECRET || "finopenpos-secure-fallback-secret-12345-abcde",
  session: { strategy: "jwt" }, // PouchDB doesn't use an adapter session
  providers: [
    Credentials({
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          console.error("Auth: Missing email or password");
          return null;
        }
        
        console.log(`Auth attempt for: ${credentials.email}`);

        // 1. Check Master Admin from .env (with hardcoded fallback for setup)
        const adminEmail = process.env.ADMIN_EMAIL || "admin@pos.com";
        const adminPassword = process.env.ADMIN_PASSWORD || "admin123";

        console.log(`Master Admin Config: email=${adminEmail ? 'FOUND' : 'MISSING'}, password=${adminPassword ? 'FOUND' : 'MISSING'}`);

        if (adminEmail && adminPassword && 
            credentials.email === adminEmail && 
            credentials.password === adminPassword) {
          console.log("Auth: Master Admin match successful");
          return {
            id: "admin-master",
            email: adminEmail,
            name: "Master Admin",
          };
        }

        // 2. Check PouchDB Users
        try {
          console.log("Auth: Querying PouchDB for user...");
          const result = await dbUsers.find({
            selector: { email: credentials.email }
          });

          const user: any = result.docs[0];

          if (user) {
            console.log("Auth: User found in PouchDB, verifying password...");
            if (user.password === credentials.password) {
              console.log("Auth: PouchDB password match successful");
              return {
                id: user._id,
                email: user.email,
                name: user.name,
              };
            } else {
              console.warn("Auth: PouchDB password mismatch");
            }
          } else {
            console.warn("Auth: User not found in PouchDB");
          }
        } catch (error) {
          console.error("Auth PouchDB error:", error);
        }
        
        console.error("Auth: No match found for credentials");
        return null;
      }
    })
  ]
})
