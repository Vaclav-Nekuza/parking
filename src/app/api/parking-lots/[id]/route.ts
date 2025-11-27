/* eslint-disable @typescript-eslint/no-explicit-any */

import { NextResponse } from "next/server";
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
export async function DELETE(req: Request, context: any) {
  const { id } = context.params as { id: string };

  try {
    // delete slots first
    await prisma.parkingSlot.deleteMany({
      where: { parkHouseId: id },
    });

    // delete house
    await prisma.parkingHouse.delete({
      where: { id },
    });

    return NextResponse.json({ success: true }, { status: 200 });
  } catch (err) {
    console.error("DELETE /api/parking-lots/:id failed:", err);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect().catch(() => {});
  }
}