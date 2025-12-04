import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { reservationId, minutes } = body as {
      reservationId?: string;
      minutes?: number;
    };

    if (!reservationId || typeof minutes !== "number" || minutes <= 0) {
      return NextResponse.json(
        { error: "Missing or invalid reservationId / minutes" },
        { status: 400 }
      );
    }

    const reservation = await prisma.reservation.findUnique({
      where: { id: reservationId },
    });

    if (!reservation) {
      return NextResponse.json(
        { error: "Reservation not found" },
        { status: 404 }
      );
    }

    const currentEnd = new Date(reservation.end);
    const newEnd = new Date(currentEnd.getTime() + minutes * 60 * 1000);

    const updated = await prisma.reservation.update({
      where: { id: reservationId },
      data: { end: newEnd },
    });

    return NextResponse.json(updated, { status: 200 });
  } catch (err) {
    console.error("POST /reservation/prolong error:", err);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}
