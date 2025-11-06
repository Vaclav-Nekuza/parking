import { NextAuthOptions } from "next-auth";
import GoogleProvider from "next-auth/providers/google";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export const authOptions: NextAuthOptions = {
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    }),
  ],
  pages: {
    signIn: "/",
    error: "/",
  },
  callbacks: {
    async signIn({ user, account }) {
      // We'll handle user creation in our custom API route
      // This just allows the sign in to proceed
      return true;
    },
    async session({ session, token }) {
      // Add custom user data to session
      if (token.sub && session.user) {
        session.user.id = token.sub;
        session.user.userType = token.userType;
        session.user.role = token.userType;
      }
      return session;
    },
    async jwt({ token, user, account }) {
      // Persist user type in JWT token
      if (account && user) {
        // The userType will be set by our custom login flow
        // For now, we'll store the basic info
        token.sub = user.id;
      }
      return token;
    },
  },
  session: {
    strategy: "jwt",
  },
};

export default authOptions;