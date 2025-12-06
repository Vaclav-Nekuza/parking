import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import authOptions from "@/lib/auth";

type RouteParams = {
    params: Promise<{ id: string }>;
};

export async function PATCH(req: Request,{ params }: RouteParams) {
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

        //Gets admin from database
        const googleId = session.user.id;
        const admin = await prisma.admin.findUnique({ where: { googleId } })

        //Check whether admin exists in the database
        if (!admin) {
            return NextResponse.json({ error: "Admin not found" }, { status: 404 });
        }

        //Find the reservation
        const reservation = await prisma.reservation.findUnique({
            where: { id },
            select: {parkSlotId: true },
        });

        //Check if reservation exists
        if (!reservation) {
            return NextResponse.json({ error: "Reservation not found" }, { status: 404 });
        }

        const parkingHouseId = await prisma.parkingSlot.findUnique({
            where: { id: reservation.parkSlotId },
            select: { parkHouseId: true }
        });

        if (!parkingHouseId) {
            return NextResponse.json({ error: "Parking slot not found" }, { status: 404 });
        }

        const adminId = await prisma.parkingHouse.findUnique({
            where: { id: parkingHouseId.parkHouseId },
            select: { adminId: true }
        });

        if (!adminId) {
            return NextResponse.json({ error: "Parking house not found" }, { status: 404 });
        }

        //Check if the reservation exists in a parking house owned by the admin
        if (adminId.adminId !== admin.id) {
            return NextResponse.json({ error: "You can only cancel reservations tha are in your parking house" }, { status: 403 });
        }

        //Mark the reservation as cancelled
        await prisma.reservation.update({
            where: { id },
            data: { cancelledAt: new Date() },
        });

        //Successful response
        return NextResponse.json({ message: "Reservation cancelled successfully" }, { status: 200 });
    }

    catch (error: unknown) {
        return NextResponse.json({ error: (error as Error).message ?? "Internal server error" }, { status: 500 });
    }
}