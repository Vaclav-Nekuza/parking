import { NextAuthOptions } from "next-auth";
import GoogleProvider from "next-auth/providers/google";
import { prisma } from "./prisma";
import { Adapter } from "next-auth/adapters";

// Custom adapter for Driver/Admin structure
const customAdapter: Adapter = {
  async createUser(user: any) {
    // Default to creating a Driver account
    const driver = await prisma.driver.create({
      data: {
        email: user.email!,
        name: user.name,
        image: user.image,
        emailVerified: user.emailVerified,
      },
    });
    return {
      id: driver.id,
      email: driver.email,
      name: driver.name,
      image: driver.image,
      emailVerified: driver.emailVerified,
    };
  },

  async getUser(id) {
    // Check both Driver and Admin
    let driver = await prisma.driver.findUnique({ where: { id } });
    if (driver) {
      return {
        id: driver.id,
        email: driver.email,
        name: driver.name,
        image: driver.image,
        emailVerified: driver.emailVerified,
      };
    }

    let admin = await prisma.admin.findUnique({ where: { id } });
    if (admin) {
      return {
        id: admin.id,
        email: admin.email,
        name: admin.name,
        image: admin.image,
        emailVerified: admin.emailVerified,
      };
    }

    return null;
  },

  async getUserByEmail(email) {
    // Check both Driver and Admin
    let driver = await prisma.driver.findUnique({ where: { email } });
    if (driver) {
      return {
        id: driver.id,
        email: driver.email,
        name: driver.name,
        image: driver.image,
        emailVerified: driver.emailVerified,
      };
    }

    let admin = await prisma.admin.findUnique({ where: { email } });
    if (admin) {
      return {
        id: admin.id,
        email: admin.email,
        name: admin.name,
        image: admin.image,
        emailVerified: admin.emailVerified,
      };
    }

    return null;
  },

  async getUserByAccount({ providerAccountId, provider }) {
    const account = await prisma.account.findUnique({
      where: {
        provider_providerAccountId: {
          provider,
          providerAccountId,
        },
      },
      include: {
        driver: true,
        admin: true,
      },
    });

    if (!account) return null;

    const user = account.driver || account.admin;
    if (!user) return null;

    return {
      id: user.id,
      email: user.email,
      name: user.name,
      image: user.image,
      emailVerified: user.emailVerified,
    };
  },

  async updateUser({ id, ...data }) {
    // Check if it's a driver or admin
    let driver = await prisma.driver.findUnique({ where: { id } });
    if (driver) {
      const updated = await prisma.driver.update({
        where: { id },
        data: {
          name: data.name,
          email: data.email!,
          image: data.image,
          emailVerified: data.emailVerified,
        },
      });
      return {
        id: updated.id,
        email: updated.email,
        name: updated.name,
        image: updated.image,
        emailVerified: updated.emailVerified,
      };
    }

    let admin = await prisma.admin.findUnique({ where: { id } });
    if (admin) {
      const updated = await prisma.admin.update({
        where: { id },
        data: {
          name: data.name,
          email: data.email!,
          image: data.image,
          emailVerified: data.emailVerified,
        },
      });
      return {
        id: updated.id,
        email: updated.email,
        name: updated.name,
        image: updated.image,
        emailVerified: updated.emailVerified,
      };
    }

    throw new Error("User not found");
  },

  async linkAccount(account: any) {
    // Check if account already exists
    const existingAccount = await prisma.account.findUnique({
      where: {
        provider_providerAccountId: {
          provider: account.provider,
          providerAccountId: account.providerAccountId,
        },
      },
    });

    if (existingAccount) {
      // Update existing account if needed
      const userType = await getUserType(account.userId);
      
      await prisma.account.update({
        where: {
          provider_providerAccountId: {
            provider: account.provider,
            providerAccountId: account.providerAccountId,
          },
        },
        data: {
          userId: account.userId,
          userType: userType || "driver",
          refresh_token: account.refresh_token,
          access_token: account.access_token,
          expires_at: account.expires_at,
          token_type: account.token_type,
          scope: account.scope,
          id_token: account.id_token,
          session_state: account.session_state,
        },
      });
      return;
    }

    // Create new account
    const userType = await getUserType(account.userId);
    
    await prisma.account.create({
      data: {
        userId: account.userId,
        userType: userType || "driver", // Default to driver if not found
        type: account.type,
        provider: account.provider,
        providerAccountId: account.providerAccountId,
        refresh_token: account.refresh_token,
        access_token: account.access_token,
        expires_at: account.expires_at,
        token_type: account.token_type,
        scope: account.scope,
        id_token: account.id_token,
        session_state: account.session_state,
      },
    });
  },

  async createSession({ sessionToken, userId, expires }) {
    const userType = await getUserType(userId);
    
    const session = await prisma.session.create({
      data: {
        sessionToken,
        userId,
        userType: userType || "driver", // Default to driver if not found
        expires,
      },
    });

    return {
      sessionToken: session.sessionToken,
      userId: session.userId,
      expires: session.expires,
    };
  },

  async getSessionAndUser(sessionToken) {
    const session = await prisma.session.findUnique({
      where: { sessionToken },
      include: {
        driver: true,
        admin: true,
      },
    });

    if (!session) return null;

    const user = session.driver || session.admin;
    if (!user) return null;

    return {
      session: {
        sessionToken: session.sessionToken,
        userId: session.userId,
        expires: session.expires,
      },
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        image: user.image,
        emailVerified: user.emailVerified,
      },
    };
  },

  async updateSession({ sessionToken, ...data }) {
    const session = await prisma.session.update({
      where: { sessionToken },
      data,
    });

    return {
      sessionToken: session.sessionToken,
      userId: session.userId,
      expires: session.expires,
    };
  },

  async deleteSession(sessionToken) {
    await prisma.session.delete({
      where: { sessionToken },
    });
  },

  async createVerificationToken({ identifier, expires, token }) {
    const verificationToken = await prisma.verificationToken.create({
      data: {
        identifier,
        token,
        expires,
      },
    });

    return {
      identifier: verificationToken.identifier,
      token: verificationToken.token,
      expires: verificationToken.expires,
    };
  },

  async useVerificationToken({ identifier, token }) {
    try {
      const verificationToken = await prisma.verificationToken.delete({
        where: {
          identifier_token: {
            identifier,
            token,
          },
        },
      });

      return {
        identifier: verificationToken.identifier,
        token: verificationToken.token,
        expires: verificationToken.expires,
      };
    } catch (error) {
      return null;
    }
  },
};

// Helper function to determine user type
async function getUserType(userId: string): Promise<"driver" | "admin" | null> {
  try {
    const driver = await prisma.driver.findUnique({ where: { id: userId } });
    if (driver) return "driver";
    
    const admin = await prisma.admin.findUnique({ where: { id: userId } });
    if (admin) return "admin";
    
    return null; // User not found in either table
  } catch (error) {
    console.error("Error determining user type:", error);
    return null;
  }
}

export const authOptions: NextAuthOptions = {
  adapter: customAdapter,
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    }),
  ],
  callbacks: {
    async session({ session, user }) {
      if (session.user && user) {
        session.user.id = user.id;
        
        // Determine user type and role
        const userType = await getUserType(user.id);
        session.user.role = userType || "driver";
        session.user.userType = userType || "driver";
      }
      return session;
    },
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        const userType = await getUserType(user.id);
        token.userType = userType || "driver";
      }
      return token;
    },
  },
  pages: {
    signIn: "/login",
  },
  session: {
    strategy: "database",
  },
  secret: process.env.NEXTAUTH_SECRET,
};