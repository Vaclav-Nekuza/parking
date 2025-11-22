// src/app/api/parkinglots/route.ts
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

/** GET -> list all parking houses */
export async function GET() {
  try {
    const data = await prisma.parkingHouse.findMany();
    return NextResponse.json(data, { status: 200 });
  } catch (err) {
    console.error("GET /api/parkinglots failed:", err);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  } finally {
    await prisma.$disconnect().catch(() => {});
  }
}
