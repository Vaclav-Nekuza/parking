import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// Helper function to get authenticated driver from session
async function getAuthenticatedDriver(request: Request) {
    const sessionToken = request.headers.get('authorization')?.replace('Bearer ', '') || 
                        request.headers.get('x-session-token');
                        
    if (!sessionToken) {
        return null;
    }
    
    const session = await prisma.session.findUnique({
        where: { sessionToken },
        include: { driver: true }
    });
    
    if (!session || !session.isActive || session.expires < new Date() || session.userType !== 'driver') {
        return null;
    }
    
    return session.driver;
}

// GET /api/vehicle-registration
// GET /api/vehicle-registration?id=...
// GET /api/vehicle-registration?spz=...
export async function GET(request: Request) {
    try {
        const { searchParams } = new URL(request.url);
        const idReq = searchParams.get("id");
        const spzReq = searchParams.get("SPZ");

        if (idReq) {
            const vehicle = await prisma.vehicle.findUnique({ where: { id:idReq } });
            if (!vehicle) return NextResponse.json({ error: "Vehicle not found" }, { status: 404 });
            return NextResponse.json(vehicle, { status: 200 });
        }

        if (spzReq) {
            const vehicle = await prisma.vehicle.findFirst({ where: { SPZ:spzReq } });
            if (!vehicle) return NextResponse.json({ error: "Vehicle not found" }, { status: 404 });
            return NextResponse.json(vehicle, { status: 200 });
        }

        // Return all vehicles if no filter provided
        const vehicles = await prisma.vehicle.findMany();
        return NextResponse.json(vehicles, { status: 200 });
    } catch (error) {
        console.error("GET /vehicles error:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}

// POST /api/vehicle-registration
// {
// "spz": spz
// "type": type
// }
export async function POST(request: Request) {
    try {
        // Get authenticated driver from session
        const driver = await getAuthenticatedDriver(request);
        
        if (!driver) {
            return NextResponse.json(
                { error: "Authentication required. Please log in as a driver." },
                { status: 401 }
            );
        }

        const data = await request.json();
        const { spzReq, typeReq } = data;

        if (!spzReq || !typeReq) {
            return NextResponse.json(
                { error: "Missing required fields: spz, type" },
                { status: 400 }
            );
        }

        const spz_existing = await prisma.vehicle.findFirst({ where: { SPZ: spzReq } });
        if (spz_existing) {
            return NextResponse.json(
                { error: "Vehicle with this SPZ already exists" },
                { status: 409 }
            );
        }

        const vehicle = await prisma.vehicle.create({
            data: { 
                SPZ: spzReq, 
                driverId: driver.id, 
                type: typeReq 
            },
        });

        return NextResponse.json(vehicle, { status: 201 });
    } catch (error) {
        console.error("POST /vehicles error:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
