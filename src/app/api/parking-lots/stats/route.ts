import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthenticatedAdmin } from "@/lib/server-auth";

interface BucketStats {
    startDate: string;
    endDate: string;
    reservations: number;
    cancelledReservations: number;
}

interface ParkingHouseStats {
    parkingHouseId: string;
    address: string;
    totalReservations: number;
    totalCancelledReservations: number;
    buckets: BucketStats[];
}

// GET /api/parking-lots/stats?days=30&interval=day
export async function GET(request: Request) {
    try {
        // Get authenticated admin from session
        const admin = await getAuthenticatedAdmin();

        if (!admin) {
            return NextResponse.json(
                { error: "Authentication required. Please log in as an admin." },
                { status: 401 }
            );
        }

        // Parse query parameters
        const { searchParams } = new URL(request.url);
        const daysParam = searchParams.get("days");
        const intervalParam = searchParams.get("interval") || "day";

        // Validate interval parameter
        if (intervalParam !== "day" && intervalParam !== "week") {
            return NextResponse.json(
                { error: "Invalid interval parameter. Must be 'day' or 'week'." },
                { status: 400 }
            );
        }

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
        endDate.setHours(23, 59, 59, 999);
        const startDate = new Date();
        startDate.setDate(startDate.getDate() - days);
        startDate.setHours(0, 0, 0, 0);

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
            const buckets: BucketStats[] = [];

            // Collect all reservations for this parking house
            const allReservations = house.ParkingSlot.flatMap(slot => slot.Reservation);

            // Calculate totals
            const totalReservations = allReservations.length;
            const totalCancelledReservations = allReservations.filter(r => r.cancelledAt !== null).length;

            // Generate buckets based on interval
            const bucketSize = intervalParam === "week" ? 7 : 1;

            for (let i = 0; i < days; i += bucketSize) {
                const bucketStart = new Date(startDate);
                bucketStart.setDate(startDate.getDate() + i);
                bucketStart.setHours(0, 0, 0, 0);

                const bucketEnd = new Date(bucketStart);
                bucketEnd.setDate(bucketStart.getDate() + bucketSize - 1);
                bucketEnd.setHours(23, 59, 59, 999);

                // Don't let bucket extend beyond the end date
                if (bucketEnd > endDate) {
                    bucketEnd.setTime(endDate.getTime());
                }

                // Count reservations in this bucket
                let reservations = 0;
                let cancelledReservations = 0;

                for (const reservation of allReservations) {
                    // Check if reservation overlaps with this bucket
                    const overlaps = reservation.start <= bucketEnd && reservation.end >= bucketStart;

                    if (overlaps) {
                        reservations++;
                        if (reservation.cancelledAt !== null) {
                            cancelledReservations++;
                        }
                    }
                }

                buckets.push({
                    startDate: bucketStart.toISOString().split('T')[0],
                    endDate: bucketEnd.toISOString().split('T')[0],
                    reservations,
                    cancelledReservations
                });
            }

            return {
                parkingHouseId: house.id,
                address: house.address,
                totalReservations,
                totalCancelledReservations,
                buckets
            };
        });

        return NextResponse.json(stats, { status: 200 });

    } catch (error) {
        console.error("GET /api/parking-lots/stats error:", error);
        // Log full stack trace
        if (error instanceof Error) {
            console.error(error.stack);
        }
        return NextResponse.json(
            { error: "Internal Server Error" },
            { status: 500 }
        );
    }
}
