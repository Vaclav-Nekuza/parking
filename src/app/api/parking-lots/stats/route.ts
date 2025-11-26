import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// Helper function to get authenticated admin from session
async function getAuthenticatedAdmin(request: Request) {
    const sessionToken = request.headers.get('authorization')?.replace('Bearer ', '') || 
                        request.headers.get('x-session-token');
                        
    if (!sessionToken) {
        return null;
    }
    
    const session = await prisma.session.findUnique({
        where: { sessionToken },
        include: { admin: true }
    });
    
    if (!session || !session.isActive || session.expires < new Date() || session.userType !== 'admin') {
        return null;
    }
    
    return session.admin;
}

interface DailyUsageStats {
    date: string;
    usagePercentage: number;
    totalSlots: number;
    occupiedSlots: number;
}

interface ParkingHouseStats {
    parkingHouseId: string;
    address: string;
    dailyUsage: DailyUsageStats[];
}

// GET /api/parking-lots/stats?days=30
export async function GET(request: Request) {
    try {
        // Get authenticated admin from session
        const admin = await getAuthenticatedAdmin(request);
        
        if (!admin) {
            return NextResponse.json(
                { error: "Authentication required. Please log in as an admin." },
                { status: 401 }
            );
        }

        // Parse query parameters
        const { searchParams } = new URL(request.url);
        const daysParam = searchParams.get("days");
        
        // Validate days parameter
        let days = 30; // default
        if (daysParam) {
            const parsedDays = parseInt(daysParam, 10);
            if (isNaN(parsedDays) || parsedDays <= 0) {
                return NextResponse.json(
                    { error: "Invalid days parameter. Must be a positive integer." },
                    { status: 400 }
                );
            }
            if (parsedDays > 365) {
                return NextResponse.json(
                    { error: "Days parameter cannot exceed 365." },
                    { status: 400 }
                );
            }
            days = parsedDays;
        }

        // Calculate date range
        const endDate = new Date();
        const startDate = new Date();
        startDate.setDate(startDate.getDate() - days);

        // Get all parking houses owned by this admin
        const parkingHouses = await prisma.parkingHouse.findMany({
            where: { adminId: admin.id },
            include: {
                ParkingSlot: {
                    include: {
                        Reservation: {
                            where: {
                                OR: [
                                    // Reservations that start within the date range
                                    {
                                        start: {
                                            gte: startDate,
                                            lte: endDate
                                        }
                                    },
                                    // Reservations that end within the date range
                                    {
                                        end: {
                                            gte: startDate,
                                            lte: endDate
                                        }
                                    },
                                    // Reservations that span the entire date range
                                    {
                                        AND: [
                                            { start: { lte: startDate } },
                                            { end: { gte: endDate } }
                                        ]
                                    }
                                ]
                            }
                        }
                    }
                }
            }
        });

        // Calculate statistics for each parking house
        const stats: ParkingHouseStats[] = parkingHouses.map(house => {
            const totalSlots = house.ParkingSlot.length;
            const dailyUsage: DailyUsageStats[] = [];

            // Generate stats for each day
            for (let i = 0; i < days; i++) {
                const currentDate = new Date(startDate);
                currentDate.setDate(currentDate.getDate() + i);
                const dayStart = new Date(currentDate.setHours(0, 0, 0, 0));
                const dayEnd = new Date(currentDate.setHours(23, 59, 59, 999));

                // Count occupied slots for this day
                let occupiedSlots = 0;
                
                for (const slot of house.ParkingSlot) {
                    // Check if any reservation overlaps with this day
                    const hasReservation = slot.Reservation.some(reservation => {
                        return reservation.start <= dayEnd && reservation.end >= dayStart;
                    });
                    
                    if (hasReservation) {
                        occupiedSlots++;
                    }
                }

                const usagePercentage = totalSlots > 0 
                    ? Math.round((occupiedSlots / totalSlots) * 100 * 100) / 100 // Round to 2 decimal places
                    : 0;

                dailyUsage.push({
                    date: dayStart.toISOString().split('T')[0], // Format as YYYY-MM-DD
                    usagePercentage,
                    totalSlots,
                    occupiedSlots
                });
            }

            return {
                parkingHouseId: house.id,
                address: house.address,
                dailyUsage
            };
        });

        return NextResponse.json(stats, { status: 200 });

    } catch (error) {
        console.error("GET /api/parking-lots/stats error:", error);
        return NextResponse.json(
            { error: "Internal Server Error" },
            { status: 500 }
        );
    } finally {
        await prisma.$disconnect().catch(() => {});
    }
}
