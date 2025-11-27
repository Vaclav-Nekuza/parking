import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import authOptions from "@/lib/auth";

type RouteParams = {
  params: Promise<{ id: string }>;
};

//DELETE -> cancels (deletes) a reservation
export async function DELETE(req: Request, { params }: RouteParams) {
  try {
    //Google account session check
    const session = await getServerSession(authOptions);
    if (!session || !session.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;

    //Check that reservation id is valid object id
    function isValidObjectId(id: string) {
      return /^[a-f\d]{24}$/i.test(id);
    }

    if (!isValidObjectId(id)) {
      return NextResponse.json({ error: "Invalid reservation ID format" }, { status: 400 });
    }

    //Get driver from database
    const googleId = session.user.id;
    const driver = await prisma.driver.findUnique({ where: { googleId } });

    //Check whether driver exists in the database
    if (!driver) {
      return NextResponse.json({ error: "Driver not found" }, { status: 404 });
    }

    //Find the reservation
    const reservation = await prisma.reservation.findUnique({
      where: { id },
      select: { id: true, driverId: true },
    });

    //Check if reservation exists
    if (!reservation) {
      return NextResponse.json({ error: "Reservation not found" }, { status: 404 });
    }

    //Check if the reservation belongs to the current driver
    if (reservation.driverId !== driver.id) {
      return NextResponse.json({ error: "You can only cancel your own reservations" }, { status: 403 });
    }

    //Mark the reservation as cancelled
    await prisma.reservation.update({
      where: { id },
      data: { cancelledAt: new Date() },
    });

    //Successful response
    return NextResponse.json({ message: "Reservation cancelled successfully" }, { status: 200 });
  } catch (error: unknown) {
    return NextResponse.json({ error: (error as Error).message ?? "Internal server error" }, { status: 500 });
  }
}
