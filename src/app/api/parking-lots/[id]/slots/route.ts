import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

type RouteParams = {
  params: Promise<{ id: string }>;
};

/** GET -> fetch all parking slots for a specific parking lot with their reservation status */
export async function GET(req: Request, { params }: RouteParams) {
  try {
    const { id } = await params;

    // Validate parking lot ID format
    if (!/^[a-f\d]{24}$/i.test(id)) {
      return NextResponse.json({ error: "Invalid parking lot ID format" }, { status: 400 });
    }

    // Check if parking house exists
    const parkingHouse = await prisma.parkingHouse.findUnique({
      where: { id },
      select: { id: true, address: true, price: true },
    });

    if (!parkingHouse) {
      return NextResponse.json({ error: "Parking lot not found" }, { status: 404 });
    }

    // Fetch all parking slots for this parking house
    const slots = await prisma.parkingSlot.findMany({
      where: { parkHouseId: id },
      select: { id: true },
      orderBy: { createdAt: "asc" },
    });

    const now = new Date();

    // For each slot, check if there's an active reservation
    const slotsWithStatus = await Promise.all(
      slots.map(async (slot, index) => {
        // Find the current or next reservation for this slot (excluding cancelled reservations)
        const currentReservation = await prisma.reservation.findFirst({
          where: {
            parkSlotId: slot.id,
            end: { gt: now }, // Reservation hasn't ended yet
            cancelledAt: null, // Only consider non-cancelled reservations
          },
          orderBy: { start: "asc" },
          select: { start: true, end: true },
        });

        let status;
        if (!currentReservation) {
          // No upcoming reservations, slot is completely free
          status = { state: "free-now" as const, freeUntil: null };
        } else if (currentReservation.start <= now) {
          // Currently occupied
          status = {
            state: "busy" as const,
            freeFrom: currentReservation.end.toISOString(),
          };
        } else {
          // Free now but reserved later
          status = {
            state: "free-now" as const,
            freeUntil: currentReservation.start.toISOString(),
          };
        }

        return {
          id: slot.id,
          label: String(index + 1),
          status,
        };
      })
    );

    return NextResponse.json(
      {
        parkingHouse: {
          id: parkingHouse.id,
          address: parkingHouse.address,
          pricePerHour: parkingHouse.price,
        },
        slots: slotsWithStatus,
      },
      { status: 200 }
    );
  } catch (err) {
    console.error("GET /api/parking-lots/[id]/slots failed:", err);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
