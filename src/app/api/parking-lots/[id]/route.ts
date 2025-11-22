// app/api/parking-lots/[id]/route.ts
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function DELETE(
  request: Request,
  context: { params: Promise<{ id: string }> }
) {
  const { id } = await context.params;

  // Check missing id
  if (!id) {
    return NextResponse.json(
      { error: "Missing parking lot id in URL" },
      { status: 400 }
    );
  }

  try {
    // Check if ParkingHouse exists
    const existing = await prisma.parkingHouse.findUnique({
      where: { id },
    });

    if (!existing) {
      return NextResponse.json(
        { error: "Parking lot not found" },
        { status: 404 }
      );
    }

    // Delete all related ParkingSlots first
    await prisma.parkingSlot.deleteMany({
      where: { parkHouseId: id },
    });

    // Now delete the ParkingHouse
    await prisma.parkingHouse.delete({
      where: { id },
    });

    return NextResponse.json(
      { message: "Parking lot deleted successfully" },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error deleting parking lot:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
