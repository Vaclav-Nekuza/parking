// src/app/api/parkinglots/availability/route.ts
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

/**
 * GET /api/parkinglots/availability
 * 
 * Lightweight endpoint that returns only availability information for all parking houses
 */
export async function GET() {
  try {
    const houses = await prisma.parkingHouse.findMany({
      select: { id: true },
    });

    const availability = await Promise.all(
      houses.map(async (house) => {
        // Get total number of parking slots
        const totalSlots = await prisma.parkingSlot.count({
          where: { parkHouseId: house.id },
        });

        // Get number of occupied slots (slots with active reservations)
        const now = new Date();
        const occupiedSlots = await prisma.reservation.count({
          where: {
            parkSlot: { parkHouseId: house.id },
            start: { lte: now },
            end: { gte: now },
            cancelledAt: null,
          },
        });

        const freeSlots = totalSlots - occupiedSlots;

        return {
          id: house.id,
          totalSlots,
          freeSlots,
        };
      })
    );

    return NextResponse.json(availability, { status: 200 });
  } catch (err) {
    console.error("GET /api/parkinglots/availability failed:", err);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect().catch(() => {});
  }
}
