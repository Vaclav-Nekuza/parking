import { NextAuthOptions } from "next-auth";
import GoogleProvider from "next-auth/providers/google";
import { prisma } from "./prisma";

export const authOptions: NextAuthOptions = {
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    }),
  ],
  callbacks: {
    async signIn({ user, account, profile }) {
      if (account?.provider === "google" && user.email) {
        // Check if user already exists as Driver or Admin
        const existingDriver = await prisma.driver.findUnique({
          where: { email: user.email },
        });

        const existingAdmin = await prisma.admin.findUnique({
          where: { email: user.email },
        });

        // If user doesn't exist, they'll be redirected to setup
        if (!existingDriver && !existingAdmin) {
          return true; // Allow sign in, but they'll be redirected to setup
        }

        return true; // User exists, allow sign in
      }
      return true;
    },
    async jwt({ token, user, account }) {
      if (user && user.email) {
        // Determine user type
        const existingDriver = await prisma.driver.findUnique({
          where: { email: user.email },
        });

        const existingAdmin = await prisma.admin.findUnique({
          where: { email: user.email },
        });

        if (existingDriver) {
          token.id = existingDriver.id;
          token.role = "driver";
          token.userType = "driver";
        } else if (existingAdmin) {
          token.id = existingAdmin.id;
          token.role = "admin";
          token.userType = "admin";
        } else {
          // User doesn't exist yet
          token.id = `temp_${user.email}`;
          token.role = "pending";
          token.userType = "pending";
        }
      }
      return token;
    },
    async session({ session, token }) {
      if (token && session.user) {
        session.user.id = token.id as string;
        session.user.role = token.role as "driver" | "admin";
        session.user.userType = token.userType as "driver" | "admin";
      }
      return session;
    },
    async redirect({ url, baseUrl }) {
      // If user has pending role, redirect to setup
      if (url.includes("setup-account") || url.includes("complete-signup")) {
        return url;
      }
      
      // Default redirect
      if (url.startsWith("/")) return `${baseUrl}${url}`;
      if (new URL(url).origin === baseUrl) return url;
      return baseUrl;
    },
  },
  pages: {
    signIn: "/login",
  },
  session: {
    strategy: "jwt",
  },
  secret: process.env.NEXTAUTH_SECRET,
};