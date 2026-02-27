import NextAuth from "next-auth"
import { MongoDBAdapter } from "@auth/mongodb-adapter"
import clientPromise from "./lib/mongodb-raw"
import { authConfig } from "./auth.config"
import Credentials from "next-auth/providers/credentials"
import connectToDatabase from "./lib/mongodb"
import mongoose from "mongoose"

export const { handlers, signIn, signOut, auth } = NextAuth({
  ...authConfig,
  adapter: MongoDBAdapter(clientPromise),
  providers: [
    Credentials({
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) return null;
        
        await connectToDatabase();
        // Dynamic User model definition to avoid schema issues in some environments
        const User = mongoose.models.User || mongoose.model('User', new mongoose.Schema({
            email: { type: String, unique: true },
            password: { type: String },
            name: { type: String },
        }));

        const user = await User.findOne({ email: credentials.email });

        // IMPORTANT: In production, hash and compare!
        if (user && user.password === credentials.password) {
          return {
            id: user._id.toString(),
            email: user.email,
            name: user.name,
          };
        }
        return null;
      }
    })
  ]
})
