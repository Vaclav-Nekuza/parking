import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Await params as required by Next.js
    const { id } = await params;

    // 1. Check if user is signed in
    const session = await getServerSession(authOptions);
    if (!session || !session.user?.email) {
      return NextResponse.json(
        { error: "Unauthorized. Please sign in." },
        { status: 401 }
      );
    }

    // 2. Get the admin user from database by email
    const admin = await prisma.admin.findUnique({
      where: { email: session.user.email },
    });

    if (!admin) {
      return NextResponse.json(
        { error: "Forbidden. Admin access required." },
        { status: 403 }
      );
    }

    // 3. Check if admin has an active session
    const userSession = await prisma.session.findFirst({
      where: {
        isActive: true,
        expires: { gt: new Date() },
        adminId: admin.id,
        userType: "admin",
      },
    });

    if (!userSession) {
      return NextResponse.json(
        { error: "Forbidden. Admin access required." },
        { status: 403 }
      );
    }

    // 4. Load the parking house and check ownership
    const parkingHouse = await prisma.parkingHouse.findUnique({
      where: { id },
    });

    if (!parkingHouse) {
      return NextResponse.json(
        { error: "Parking lot not found." },
        { status: 404 }
      );
    }

    if (parkingHouse.adminId !== admin.id) {
      return NextResponse.json(
        { error: "Forbidden. You can only delete your own parking lots." },
        { status: 403 }
      );
    }

    // 4. Delete related parking slots first, then the parking house
    await prisma.parkingSlot.deleteMany({
      where: { parkHouseId: id },
    });

    await prisma.parkingHouse.delete({
      where: { id },
    });

    // 5. Return success response
    return NextResponse.json(
      { message: "Parking lot deleted successfully" },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error deleting parking lot:", error);
    return NextResponse.json(
      { error: "Internal server error." },
      { status: 500 }
    );
  }
}
