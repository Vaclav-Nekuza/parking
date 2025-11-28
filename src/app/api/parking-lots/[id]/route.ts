/* eslint-disable @typescript-eslint/no-explicit-any */

import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// GET /api/parking-lots/:id
export async function GET(req: Request, context: any) {
  const { id } = context.params as { id: string };

  try {
    const house = await prisma.parkingHouse.findUnique({
      where: { id },
      select: { id: true, address: true, price: true },
    });

    if (!house) {
      return NextResponse.json(
        { error: "Parking lot not found" },
        { status: 404 }
      );
    }

    const capacity = await prisma.parkingSlot.count({
      where: { parkHouseId: id },
    });

    return NextResponse.json(
      {
        id: house.id,
        address: house.address,
        capacity,
        pricePerHour: house.price,
      },
      { status: 200 }
    );
  } catch (err) {
    console.error("GET /api/parking-lots/:id failed:", err);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect().catch(() => {});
  }
}

// PUT /api/parking-lots/:id
export async function PUT(req: Request, context: any) {
  const { id } = context.params as { id: string };

  try {
    const body = await req.json();
    const { address, capacity, pricePerHour } = body;

    if (typeof address !== "string" || address.trim() === "") {
      return NextResponse.json({ error: "Invalid address" }, { status: 400 });
    }

    const parsedCapacity = Number(capacity);
    if (!Number.isInteger(parsedCapacity) || parsedCapacity <= 0) {
      return NextResponse.json({ error: "Invalid capacity" }, { status: 400 });
    }

    const parsedPrice = Number(pricePerHour);
    if (!Number.isInteger(parsedPrice) || parsedPrice < 0) {
      return NextResponse.json({ error: "Invalid price" }, { status: 400 });
    }

    // update parking house itself
    const updated = await prisma.parkingHouse.update({
      where: { id },
      data: {
        address: address.trim(),
        price: parsedPrice,
      },
    });

    // adjust number of slots
    const currentSlots = await prisma.parkingSlot.count({
      where: { parkHouseId: id },
    });

    if (parsedCapacity > currentSlots) {
      // add missing slots
      const toAdd = parsedCapacity - currentSlots;
      await prisma.parkingSlot.createMany({
        data: Array.from({ length: toAdd }, () => ({
          parkHouseId: id,
          address: address.trim(),
        })),
      });
    } else if (parsedCapacity < currentSlots) {
      // remove extra slots
      const toRemove = currentSlots - parsedCapacity;

      const slotsToDelete = await prisma.parkingSlot.findMany({
        where: { parkHouseId: id },
        select: { id: true },
        take: toRemove,
      });

      await prisma.parkingSlot.deleteMany({
        where: { id: { in: slotsToDelete.map((s) => s.id) } },
      });
    }

    return NextResponse.json(
      {
        id: updated.id,
        address: updated.address,
        capacity: parsedCapacity,
        pricePerHour: updated.price,
      },
      { status: 200 }
    );
  } catch (err) {
    console.error("PUT /api/parking-lots/:id failed:", err);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect().catch(() => {});
  }
}

// DELETE /api/parking-lots/:id
export async function DELETE(request: NextRequest, context: any) {
  const { id } = context.params as { id: string };

  try {
    // 1. Check if user is signed in
    const session = await getServerSession(authOptions);
    if (!session || !session.user?.email) {
      return NextResponse.json(
        { error: "Unauthorized. Please sign in." },
        { status: 401 }
      );
    }

    // 2. Get the admin user from database by email
    const admin = await prisma.admin.findUnique({
      where: { email: session.user.email },
    });

    if (!admin) {
      return NextResponse.json(
        { error: "Forbidden. Admin access required." },
        { status: 403 }
      );
    }

    // 3. Check if admin has an active session
    const userSession = await prisma.session.findFirst({
      where: {
        isActive: true,
        expires: { gt: new Date() },
        adminId: admin.id,
        userType: "admin",
      },
    });

    if (!userSession) {
      return NextResponse.json(
        { error: "Forbidden. Admin access required." },
        { status: 403 }
      );
    }

    // 4. Load the parking house and check ownership
    const parkingHouse = await prisma.parkingHouse.findUnique({
      where: { id },
    });

    if (!parkingHouse) {
      return NextResponse.json(
        { error: "Parking lot not found." },
        { status: 404 }
      );
    }

    if (parkingHouse.adminId !== admin.id) {
      return NextResponse.json(
        { error: "Forbidden. You can only delete your own parking lots." },
        { status: 403 }
      );
    }

    // 5. Delete related parking slots first, then the parking house
    await prisma.parkingSlot.deleteMany({
      where: { parkHouseId: id },
    });

    await prisma.parkingHouse.delete({
      where: { id },
    });

    // 6. Return success response
    return NextResponse.json(
      { message: "Parking lot deleted successfully" },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error deleting parking lot:", error);
    return NextResponse.json(
      { error: "Internal server error." },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect().catch(() => {});
  }
}
