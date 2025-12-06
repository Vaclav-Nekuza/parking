import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getAuthenticatedAdmin } from "@/lib/server-auth";

/** GET -> list all parking lots for the authenticated admin */
export async function GET() {
  try {
    const admin = await getAuthenticatedAdmin();

    if (!admin) {
      return NextResponse.json(
        { error: "Authentication required. Please log in as an admin to view your parking lots." },
        { status: 401 }
      );
    }

    // Fetch all parking houses OWNER BY THIS ADMIN and calculate their capacity (number of parking slots)
    const houses = await prisma.parkingHouse.findMany({
      where: {
        adminId: admin.id
      },
      select: {
        id: true,
        address: true,
        price: true,
        createdAt: true,
        adminId: true,
      },
      orderBy: { createdAt: "desc" },
    });

    const withCapacity = await Promise.all(
      houses.map(async (h) => {
        const capacity = await prisma.parkingSlot.count({
          where: { parkHouseId: h.id },
        });
        return {
          id: h.id,
          address: h.address,
          capacity,
          price: h.price,
          createdAt: h.createdAt.toISOString(),
          adminId: h.adminId,
        };
      })
    );

    return NextResponse.json(withCapacity, { status: 200 });
  } catch (err) {
    console.error("GET /api/parking-lots failed:", err);
    if (err instanceof Error) {
      console.error(err.stack);
    }
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
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
      return NextResponse.json(
        { error: "Body is not valid JSON" },
        { status: 400 }
      );
    }

    const { address, capacity, pricePerHour } = (body ?? {}) as Record<
      string,
      unknown
    >;

    // Validate input values
    if (typeof address !== "string" || address.trim() === "") {
      return NextResponse.json(
        { error: "Missing or invalid address" },
        { status: 400 }
      );
    }

    const parsedCapacity =
      typeof capacity === "number" ? capacity : Number(capacity);
    if (
      !Number.isFinite(parsedCapacity) ||
      !Number.isInteger(parsedCapacity) ||
      parsedCapacity <= 0
    ) {
      return NextResponse.json(
        { error: "Missing or invalid capacity (positive integer)" },
        { status: 400 }
      );
    }

    const parsedPricePerHour =
      typeof pricePerHour === "number" ? pricePerHour : Number(pricePerHour);
    if (
      !Number.isFinite(parsedPricePerHour) ||
      !Number.isInteger(parsedPricePerHour) ||
      parsedPricePerHour < 0
    ) {
      return NextResponse.json(
        {
          error:
            "Missing or invalid pricePerHour (non-negative integer)",
        },
        { status: 400 }
      );
    }

    try {
      // 1) Get current session
      const session = await getServerSession(authOptions);

      if (!session || !session.user?.email) {
        return NextResponse.json(
          { error: "Unauthorized. Please sign in." },
          { status: 401 }
        );
      }

      // 2) Find admin by logged-in user's email
      const admin = await prisma.admin.findUnique({
        where: { email: session.user.email },
      });

      if (!admin) {
        return NextResponse.json(
          { error: "Forbidden. Admin access required." },
          { status: 403 }
        );
      }

      // 3) Create a new ParkingHouse entry under this admin
      const house = await prisma.parkingHouse.create({
        data: {
          adminId: admin.id,
          address: address.trim(),
          price: parsedPricePerHour,
        },
        select: {
          id: true,
          address: true,
          price: true,
          createdAt: true,
          adminId: true,
        },
      });

      // 4) Create parking slots (according to capacity)
      if (parsedCapacity > 0) {
        await prisma.parkingSlot.createMany({
          data: Array.from({ length: parsedCapacity }, () => ({
            parkHouseId: house.id,
            address: address.trim(),
          })),
        });
      }

      // 5) Return the created parking lot object
      return NextResponse.json(
        {
          id: house.id,
          address: house.address,
          capacity: parsedCapacity,
          price: house.price,
          createdAt: house.createdAt.toISOString(),
          adminId: house.adminId,
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
      return NextResponse.json(
        { error: "Failed to create parking lot" },
        { status: 500 }
      );
    }
  } catch (err) {
    console.error("POST /api/parking-lots unexpected error:", err);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}