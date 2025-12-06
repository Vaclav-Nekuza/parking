import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// Helper function to get authenticated admin from session
export async function getAuthenticatedAdmin() {
    const session = await getServerSession(authOptions);

    if (!session || !session.user?.email) {
        return null;
    }

    const admin = await prisma.admin.findUnique({
        where: { email: session.user.email },
    });

    if (!admin) {
        return null;
    }

    const userSession = await prisma.session.findFirst({
        where: {
            isActive: true,
            expires: { gt: new Date() },
            adminId: admin.id,
            userType: "admin",
        },
    });

    if (!userSession) {
        return null;
    }

    return admin;
}
