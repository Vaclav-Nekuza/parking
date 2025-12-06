import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import authOptions from "@/lib/auth";

export async function GET(req: Request) {
  const isValidObjectId = (id: string) => /^[a-fA-F0-9]{24}$/.test(id);

  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const idReq = searchParams.get("id");

    if (!idReq) {
      return NextResponse.json({ error: "Missing id" }, { status: 400 });
    }

    if (!isValidObjectId(idReq)) {
      return NextResponse.json({ error: "Invalid ID" }, { status: 400 });
    }

    const reservation = await prisma.reservation.findUnique({
      where: { id: idReq },
    });
    if (!reservation) {
      return NextResponse.json(
        { error: "Reservation not found" },
        { status: 404 }
      );
    }

    const driver = await prisma.driver.findUnique({
      where: { id: reservation.driverId },
    });
    if (!driver) {
      return NextResponse.json(
        { error: "Driver not found" },
        { status: 404 }
      );
    }

    const parkSlot = await prisma.parkingSlot.findUnique({
      where: { id: reservation.parkSlotId },
    });
    if (!parkSlot) {
      return NextResponse.json(
        { error: "Consistency error - parking slot not found" },
        { status: 404 }
      );
    }

    const parkingHouse = await prisma.parkingHouse.findUnique({
      where: { id: parkSlot.parkHouseId },
    });
    if (!parkingHouse) {
      return NextResponse.json(
        { error: "Consistency error - parking house not found" },
        { status: 404 }
      );
    }

    const admin = await prisma.admin.findUnique({
      where: { googleId: session.user.id },
    });

    const canAccessAsAdmin = !!admin && admin.id === parkingHouse.adminId;
    const canAccessAsDriver = reservation.driverId === driver.id;

    if (!canAccessAsAdmin && !canAccessAsDriver) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // Struktura pro FE (ProlongPage)
    const responseBody = {
    id: reservation.id,
    start: reservation.start,
    end: reservation.end,
    parkingSlot: {
        id: parkSlot.id,
        parkingHouse: {
            id: parkingHouse.id,
            address: parkingHouse.address,
            price: parkingHouse.price,
    },
  },
};



    return NextResponse.json(responseBody, { status: 200 });
  } catch (error) {
    console.error("GET /reservation/detail error:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}
