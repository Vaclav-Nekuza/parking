// src/app/api/parkinglots/route.ts
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

/**
 * GET /api/parkinglots
 *
 * - Without query params  → returns ALL parking houses (for drivers)
 * - With ?scope=mine      → returns ONLY parking houses owned by current admin
 */
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const scope = searchParams.get("scope");

  try {
    // 🔹 Case 1: /api/parkinglots  (no special scope) → all lots (driver use case)
    if (scope !== "mine") {
      const data = await prisma.parkingHouse.findMany();
      return NextResponse.json(data, { status: 200 });
    }

    // 🔹 Case 2: /api/parkinglots?scope=mine → only current admin's lots
    const session = await getServerSession(authOptions);

    if (!session || !session.user?.email) {
      return NextResponse.json(
        { error: "Unauthorized. Please sign in." },
        { status: 401 }
      );
    }

    const admin = await prisma.admin.findUnique({
      where: { email: session.user.email },
    });

    if (!admin) {
      return NextResponse.json(
        { error: "Forbidden. Admin access required." },
        { status: 403 }
      );
    }

    const data = await prisma.parkingHouse.findMany({
      where: { adminId: admin.id },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json(data, { status: 200 });
  } catch (err) {
    console.error("GET /api/parkinglots failed:", err);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect().catch(() => {});
  }
}