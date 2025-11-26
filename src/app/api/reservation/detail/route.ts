import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import authOptions from "@/lib/auth";

// GET /api/reservation/detail?id=...
export async function GET(req: Request) {
    const isValidObjectId = (id: string) => /^[a-fA-F0-9]{24}$/.test(id);
    try {
        const session = await getServerSession(authOptions);
        if (!session || !session.user?.id) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }
        const { searchParams } = new URL(req.url);
        const idReq = searchParams.get("id");
        if (idReq){
            if (!isValidObjectId(idReq)) {
                return NextResponse.json({error: "Invalid ID"}, {status: 400});
            }
            const reservation = await prisma.reservation.findUnique( {where: {id: idReq} } );
            if (!reservation) return NextResponse.json({ error: "Reservation not found" }, { status: 404 });

            const parkSlot = await prisma.parkingSlot.findUnique( {where: {id: reservation.parkSlotId} } );
            if (!parkSlot) return NextResponse.json({ error: "Consistency error - parking slot not found" }, { status: 404 });

            const parkingHouse = await prisma.parkingHouse.findUnique( {where: {id: parkSlot.parkHouseId} } );
            if (!parkingHouse) return NextResponse.json({ error: "Consistency error - parking house not found" }, { status: 404 });

            if (reservation.driverId === session.user.id || session.user.id === parkingHouse.adminId) {
                return NextResponse.json(reservation, { status: 200 });
            } else return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

    } catch (error) {
        console.error("GET /reservation/detail error:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}