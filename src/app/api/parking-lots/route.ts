// app/api/parking-lots/route.ts
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

/** GET -> list all parking lots */
export async function GET() {
  try {
    // Fetch all parking houses and calculate their capacity (number of parking slots)
    const houses = await prisma.parkingHouse.findMany({
      select: { id: true, address: true, price: true },
      orderBy: { createdAt: "desc" },
    });

    const withCapacity = await Promise.all(
      houses.map(async (h) => {
        const capacity = await prisma.parkingSlot.count({ where: { parkHouseId: h.id } });
        return {
          id: h.id,
          address: h.address,
          capacity,
          pricePerHour: h.price,
        };
      })
    );

    return NextResponse.json(withCapacity, { status: 200 });
  } catch (err) {
    console.error("GET /api/parking-lots failed:", err);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  } finally {
    await prisma.$disconnect().catch(() => {});
  }
}

/** POST -> create a new parking lot */
export async function POST(req: Request) {
  try {
    // Safely parse incoming JSON body
    let body: unknown;
    try {
      body = await req.json();
    } catch {
      return NextResponse.json({ error: "Body is not valid JSON" }, { status: 400 });
    }

    const { address, capacity, pricePerHour } = (body ?? {}) as Record<string, unknown>;

    // Validate input values
    if (typeof address !== "string" || address.trim() === "") {
      return NextResponse.json({ error: "Missing or invalid address" }, { status: 400 });
    }

    const parsedCapacity = typeof capacity === "number" ? capacity : Number(capacity);
    if (!Number.isFinite(parsedCapacity) || !Number.isInteger(parsedCapacity) || parsedCapacity <= 0) {
      return NextResponse.json({ error: "Missing or invalid capacity (positive integer)" }, { status: 400 });
    }

    const parsedPricePerHour =
      typeof pricePerHour === "number" ? pricePerHour : Number(pricePerHour);
    if (!Number.isFinite(parsedPricePerHour) || !Number.isInteger(parsedPricePerHour) || parsedPricePerHour < 0) {
      return NextResponse.json(
        { error: "Missing or invalid pricePerHour (non-negative integer)" },
        { status: 400 }
      );
    }

    try {
      // Get the first available admin (temporary logic until auth is implemented)
      const admin = await prisma.admin.findFirst();
      if (!admin) {
        return NextResponse.json(
          { error: "No admin configured. Please create an Admin first." },
          { status: 409 }
        );
      }

      // Create a new ParkingHouse entry
      const house = await prisma.parkingHouse.create({
        data: {
          adminId: admin.id,
          address: address.trim(),
          price: parsedPricePerHour,
        },
        select: { id: true, address: true, price: true },
      });

      // Create parking slots (according to capacity)
      if (parsedCapacity > 0) {
        await prisma.parkingSlot.createMany({
          data: Array.from({ length: parsedCapacity }, () => ({
            parkHouseId: house.id,
            address: address.trim(),
          })),
        });
      }

      // Return the created parking lot object
      return NextResponse.json(
        {
          id: house.id,
          address: house.address,
          capacity: parsedCapacity,
          pricePerHour: house.price,
        },
        { status: 201 }
      );
    } catch (e: unknown) {
      if ((e as { code?: string })?.code === "P2002") {
        return NextResponse.json(
          { error: "Parking lot with this address already exists" },
          { status: 409 }
        );
      }
      console.error("POST /api/parking-lots DB error:", e);
      return NextResponse.json({ error: "Failed to create parking lot" }, { status: 500 });
    } finally {
      await prisma.$disconnect().catch(() => {});
    }
  } catch (err) {
    console.error("POST /api/parking-lots unexpected error:", err);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
