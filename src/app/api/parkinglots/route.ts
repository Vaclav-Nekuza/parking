// app/api/parkinglots/route.ts
import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
 
const prisma = new PrismaClient();
 
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
 
/** POST -> create a parking house */
export async function POST(req: Request) {
  try {
    let body: unknown;
    try {
      body = await req.json();
    } catch {
      return NextResponse.json({ error: "Body is not valid JSON" }, { status: 400 });
    }
 
    const { adminId, address, price } = (body ?? {}) as Record<string, unknown>;
 
    const isValidObjectId = (v: unknown) => typeof v === "string" && /^[0-9a-fA-F]{24}$/.test(v);
    if (!isValidObjectId(adminId) || typeof address !== "string" || address.trim() === "") {
      return NextResponse.json({ error: "Missing or invalid adminId/address" }, { status: 400 });
    }
 
    const parsedPrice = typeof price === "number" ? price : Number(price);
    if (!Number.isFinite(parsedPrice) || !Number.isInteger(parsedPrice) || parsedPrice < 0) {
      return NextResponse.json({ error: "Missing or invalid price (non-negative integer)" }, { status: 400 });
    }
 
    try {
      const admin = await prisma.admin.findUnique({ where: { id: adminId as string } });
      if (!admin) return NextResponse.json({ error: "adminId does not exist" }, { status: 400 });
 
      const created = await prisma.parkingHouse.create({
        data: { adminId: admin.id, address: (address as string).trim(), price: parsedPrice },
      });
 
      return NextResponse.json(created, { status: 201 });
       } catch (e: unknown) {
      if ((e as { code?: string })?.code === "P2002") {
        return NextResponse.json(
          { error: "Parking lot with this address already exists" },
          { status: 409 }
        );
      }
 
      console.error("POST /api/parkinglots db error:", e);
      return NextResponse.json({ error: "Failed to create parking lot" }, { status: 500 });
    } finally {
      await prisma.$disconnect().catch(() => {});
    }
  } catch (err) {
    console.error("POST /api/parkinglots unexpected error:", err);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}