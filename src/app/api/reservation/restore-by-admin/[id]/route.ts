import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import authOptions from "@/lib/auth";

type RouteParams = {
  params: Promise<{ id: string }>;
};

// PATCH -> restores a cancelled reservation (admin only)
export async function PATCH(req: Request, { params }: RouteParams) {
  try {
    // Step 1: Check if user has a valid Google account session
    const session = await getServerSession(authOptions);
    if (!session || !session.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Step 2: Get the reservation ID from URL parameters
    const { id } = await params;

    // Step 3: Validate that the reservation ID is a valid MongoDB ObjectId
    // MongoDB ObjectId format: 24 hexadecimal characters
    function isValidObjectId(id: string) {
      return /^[a-f\d]{24}$/i.test(id);
    }

    if (!isValidObjectId(id)) {
      return NextResponse.json({ error: "Invalid reservation ID format" }, { status: 400 });
    }

    // Step 4: Get admin from database using their Google ID
    const googleId = session.user.id;
    const admin = await prisma.admin.findUnique({ 
      where: { googleId } 
    });

    // Step 5: Check if admin exists in the database
    if (!admin) {
      return NextResponse.json({ error: "Admin not found" }, { status: 404 });
    }

    // Step 6: Find the reservation and load related parking slot and parking house
    const reservation = await prisma.reservation.findUnique({
      where: { id },
      include: {
        parkSlot: {
          include: {
            parkHouse: {
              select: { 
                id: true,
                address: true,
                adminId: true 
              }
            }
          }
        }
      }
    });

    // Step 7: Check if reservation exists
    if (!reservation) {
      return NextResponse.json({ error: "Reservation not found" }, { status: 404 });
    }

    // Step 8: Permission check - verify that the parking house belongs to this admin
    if (reservation.parkSlot.parkHouse.adminId !== admin.id) {
      return NextResponse.json({ 
        error: "You can only restore reservations in your own parking houses" 
      }, { status: 403 });
    }

    // Step 9: Check if reservation is actually cancelled
    // Only cancelled reservations can be restored
    if (reservation.cancelledAt === null) {
      return NextResponse.json({ 
        error: "This reservation is not cancelled and cannot be restored" 
      }, { status: 400 });
    }

    // Step 10: Restore the reservation by setting cancelledAt to null
    await prisma.reservation.update({
      where: { id },
      data: { 
        cancelledAt: null 
      },
    });

    // Step 11: Return success response
    return NextResponse.json({ 
      message: "Reservation restored successfully",
      reservation: {
        id: reservation.id,
        start: reservation.start,
        end: reservation.end,
        parkingHouse: reservation.parkSlot.parkHouse.address
      }
    }, { status: 200 });

  } catch (error: unknown) {
    // Step 12: Handle any unexpected errors
    console.error("Error restoring reservation:", error);
    return NextResponse.json({ 
      error: (error as Error).message ?? "Internal server error" 
    }, { status: 500 });
  }
}
