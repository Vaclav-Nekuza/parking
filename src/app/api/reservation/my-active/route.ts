import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import authOptions from "@/lib/auth";
import { RESERVATION_GRACE_MINUTES, RESERVATION_ENDING_SOON_MINUTES } from "@/lib/config";

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

    // Fetch reservations that are still within active or grace window
    const reservations = await prisma.reservation.findMany({
      where: {
        driverId: driver.id,
        cancelledAt: null,
        // Consider "active" until end, and "grace" until end + grace
        // Mongo can't compute end + grace in query, so fetch recent and filter in code
        end: { gt: new Date(now.getTime() - RESERVATION_GRACE_MINUTES * 60_000) },
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
    const formattedReservations = reservations
      .map((res) => {
        const end = res.end;
        const graceEndsAt = new Date(end.getTime() + RESERVATION_GRACE_MINUTES * 60_000);
        if (now >= graceEndsAt) {
          // expired beyond grace; not considered active
          return null;
        }
        const phase = now < end ? "active" : "grace";
        const endingSoon = phase === "active" && (end.getTime() - now.getTime()) <= RESERVATION_ENDING_SOON_MINUTES * 60_000;

        return {
          id: res.id,
          start: res.start.toISOString(),
          end: res.end.toISOString(),
          parkSlotId: res.parkSlotId,
          parkingHouse: {
            id: res.parkSlot.parkHouse.id,
            address: res.parkSlot.parkHouse.address,
            price: res.parkSlot.parkHouse.price,
          },
          // New helper fields
          serverNow: now.toISOString(),
          graceEndsAt: graceEndsAt.toISOString(),
          phase, // 'active' | 'grace'
          endingSoon,
          graceMinutes: RESERVATION_GRACE_MINUTES,
          endingSoonMinutes: RESERVATION_ENDING_SOON_MINUTES,
        };
      })
      .filter(Boolean);

    return NextResponse.json(formattedReservations, { status: 200 });
  } catch (error: unknown) {
    console.error("GET /api/reservation/my-active failed:", error);
    return NextResponse.json(
      { error: (error as Error).message ?? "Internal server error" },
      { status: 500 }
    );
  }
}
