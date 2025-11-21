import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import authOptions from "@/lib/auth";

//POST -> creates a new reservation
export async function POST(req: Request) {

    try {
        //Google account session check
        const session = await getServerSession(authOptions);
        if (!session || !session.user?.id) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }


        //Request body
        const { parkSlotId, start, end } = await req.json();

        
        //Check for missing fields
        if (!parkSlotId || !start || !end) {
            return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
        }



        //Check that parkSlot is valid object id
        function isValidObjectId(id: string) {
            return /^[a-f\d]{24}$/i.test(id);
        }

        if (!isValidObjectId(parkSlotId)) {
            return NextResponse.json({ error: "Invalid parkSlot format" }, { status: 400 });
        }



        // Convert to Date objects
        const startDate = new Date(start);
        const endDate = new Date(end);

        // Check for invalid dates
        if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
            return NextResponse.json({ error: "Invalid date format" }, { status: 400 });
        }

        // Ensure start date is before end date
        if (startDate >= endDate) {
            return NextResponse.json({ error: "Start date must be before end date" }, { status: 400 });
        }



        //Gets driver from database
        const googleId = session.user.id;
        const driver = await prisma.driver.findUnique({where: {googleId}})

        //Checks whether driver exists in the database
        if (!driver) {
            return NextResponse.json({ error: "Driver not found" }, { status: 404 });
        }

        //Checks whether park slot exists in the database
        if (!(await prisma.parkingSlot.findUnique({ where: { id: parkSlotId } }))) {
            return NextResponse.json({ error: "Park slot not found" }, { status: 404 });
        }

        //Checks for overlapping reservations
        if (await prisma.reservation.findFirst({where: {parkSlotId, 
            AND: [
                {start :{lt: endDate}},
                {end: {gt: startDate}}
            ]
        }
        })) {
            return NextResponse.json({ error: "This parking slot is already reserved for selected date and time" }, { status: 400 });
        }



        //Creates new reservation
        const reservation = await prisma.reservation.create({
            data: {
                driverId: driver.id,
                parkSlotId: parkSlotId,
                start: startDate,
                end: endDate
            }
        })
        //Successful response
        return NextResponse.json({reservation }, { status: 200 });
    }

    catch (error: unknown) {
        return NextResponse.json({ error: (error as Error).message ?? "Internal server error" }, { status: 500 });
    }
}