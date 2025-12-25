import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import authOptions from "@/lib/auth";

// GET -> fetch current driver's active (non-cancelled, not yet ended) reservations
export async function GET() {
  try {
    // Google account session check
    const session = await getServerSession(authOptions);
    if (!session || !session.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get driver from database
    const googleId = session.user.id;
    const driver = await prisma.driver.findUnique({ where: { googleId } });

    if (!driver) {
      return NextResponse.json({ error: "Driver not found" }, { status: 404 });
    }

    const now = new Date();

    // Fetch active reservations (not cancelled, end time in the future)
    const reservations = await prisma.reservation.findMany({
      where: {
        driverId: driver.id,
        cancelledAt: null,
        end: { gt: now },
      },
      include: {
        parkSlot: {
          include: {
            parkHouse: true,
          },
        },
      },
      orderBy: {
        start: "asc",
      },
    });

    // Format the response
    const formattedReservations = reservations.map((res) => ({
      id: res.id,
      start: res.start.toISOString(),
      end: res.end.toISOString(),
      parkSlotId: res.parkSlotId,
      parkingHouse: {
        id: res.parkSlot.parkHouse.id,
        address: res.parkSlot.parkHouse.address,
        price: res.parkSlot.parkHouse.price,
      },
    }));

    return NextResponse.json(formattedReservations, { status: 200 });
  } catch (error: unknown) {
    console.error("GET /api/reservation/my-active failed:", error);
    return NextResponse.json(
      { error: (error as Error).message ?? "Internal server error" },
      { status: 500 }
    );
  }
}
