import { DefaultSession } from "next-auth";

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      role?: "driver" | "admin";
      userType?: "driver" | "admin";
    } & DefaultSession["user"];
  }

  interface User {
    role?: "driver" | "admin";
    userType?: "driver" | "admin";
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id: string;
    role?: "driver" | "admin";
    userType?: "driver" | "admin";
  }
}