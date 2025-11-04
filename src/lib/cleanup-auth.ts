import { prisma } from "./prisma";

// Clean up invalid sessions and accounts that don't have proper userType
export async function cleanupAuthData() {
  try {
    console.log("Cleaning up auth data...");

    // Delete sessions that have null userType or invalid userId references
    const deletedSessions = await prisma.session.deleteMany({
      where: {
        OR: [
          { userType: null },
          { userType: "" },
        ],
      },
    });

    console.log(`Deleted ${deletedSessions.count} invalid sessions`);

    // Delete accounts that have null userType
    const deletedAccounts = await prisma.account.deleteMany({
      where: {
        OR: [
          { userType: null },
          { userType: "" },
        ],
      },
    });

    console.log(`Deleted ${deletedAccounts.count} invalid accounts`);

    console.log("Auth data cleanup completed");
  } catch (error) {
    console.error("Error cleaning up auth data:", error);
  }
}

// Run cleanup if this file is executed directly
if (require.main === module) {
  cleanupAuthData().then(() => process.exit(0));
}