import { DefaultSession } from "next-auth";

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      role?: "driver" | "admin" | "pending";
      userType?: "driver" | "admin" | "pending";
    } & DefaultSession["user"];
  }

  interface User {
    role?: "driver" | "admin" | "pending";
    userType?: "driver" | "admin" | "pending";
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id: string;
    role?: "driver" | "admin" | "pending";
    userType?: "driver" | "admin" | "pending";
  }
}