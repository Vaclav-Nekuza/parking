import NextAuth from "next-auth";

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      name?: string | null;
      email?: string | null;
      image?: string | null;
      userType?: string;
      role?: string;
    };
  }

  interface User {
    id: string;
    userType?: string;
    role?: string;
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    userType?: string;
    role?: string;
  }
}