"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
    AreaChart,
    Area,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
    Legend,
} from "recharts";

type BucketStats = {
    startDate: string;
    endDate: string;
    reservations: number;
    cancelledReservations: number;
};

type ParkingHouseStats = {
    parkingHouseId: string;
    address: string;
    totalReservations: number;
    totalCancelledReservations: number;
    buckets: BucketStats[];
};

type Interval = "day" | "week";

function formatDateLabel(value: string) {
    const d = new Date(value);
    if (Number.isNaN(d.getTime())) return value;
    return d.toLocaleDateString("cs-CZ", { day: "2-digit", month: "2-digit" });
}

export default function StatisticsDashboard() {
    const [stats, setStats] = useState<ParkingHouseStats[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const [selectedHouseId, setSelectedHouseId] = useState<string>("all");
    const [days, setDays] = useState<number>(30);
    const [interval, setInterval] = useState<Interval>("week");

    // načtení dat
    useEffect(() => {
        const controller = new AbortController();

        async function fetchStats() {
            try {
                setLoading(true);
                setError(null);

                const res = await fetch(
                    `/api/parking-lots/stats?days=${days}&interval=${interval}`,
                    { signal: controller.signal }
                );
                if (!res.ok) {
                    const body = await res.json().catch(() => null);
                    throw new Error(
                        `Failed to fetch statistics (${res.status} ${res.statusText})${
                            body ? `: ${JSON.stringify(body)}` : ""
                        }`
                    );
                }

                const data = (await res.json()) as ParkingHouseStats[];

                setStats(data);
                // když nemám vybráno nic nebo předchozí id neexistuje, vyberu první
                if (
                    data.length > 0 &&
                    selectedHouseId !== "all" &&
                    !data.some((h) => h.parkingHouseId === selectedHouseId)
                ) {
                    setSelectedHouseId("all");
                }
            } catch (err) {
                if ((err as Error).name !== "AbortError") {
                    setError(
                        err instanceof Error ? err.message : "Failed to load statistics"
                    );
                }
            } finally {
                if (!controller.signal.aborted) {
                    setLoading(false);
                }
            }
        }

        fetchStats();

        return () => {
            controller.abort();
        };
    }, [days, interval, selectedHouseId]);

    // agregace "All parking lots"
    const selectedStats = useMemo(() => {
        if (stats.length === 0) return null;

        if (selectedHouseId === "all") {
            // předpoklad: všechny parking housy mají stejnou osu bucketů
            const templateBuckets = stats[0].buckets;

            const aggregated: ParkingHouseStats = {
                parkingHouseId: "all",
                address: "All parking lots",
                totalReservations: 0,
                totalCancelledReservations: 0,
                buckets: templateBuckets.map((b) => ({
                    ...b,
                    reservations: 0,
                    cancelledReservations: 0,
                })),
            };

            stats.forEach((house) => {
                aggregated.totalReservations += house.totalReservations;
                aggregated.totalCancelledReservations +=
                    house.totalCancelledReservations;

                house.buckets.forEach((bucket, i) => {
                    if (!aggregated.buckets[i]) return;
                    aggregated.buckets[i].reservations += bucket.reservations;
                    aggregated.buckets[i].cancelledReservations +=
                        bucket.cancelledReservations;
                });
            });

            return aggregated;
        }

        return stats.find((h) => h.parkingHouseId === selectedHouseId) ?? null;
    }, [stats, selectedHouseId]);

    const chartData = selectedStats?.buckets.map((b) => ({
        ...b,
        label: b.startDate,
    }));

    if (loading) {
        return (
            <div style={{ padding: "2rem", textAlign: "center", color: "#6b7280" }}>
                Loading statistics…
            </div>
        );
    }

    if (error) {
        return (
            <div style={{ padding: "2rem", textAlign: "center", color: "#b91c1c" }}>
                Error: {error}
            </div>
        );
    }

    if (!selectedStats || !chartData || chartData.length === 0) {
        return (
            <div style={{ padding: "2rem", textAlign: "center", color: "#6b7280" }}>
                No statistics available for the selected period.
            </div>
        );
    }

    const totalReservations = selectedStats.totalReservations;
    const totalCancelled = selectedStats.totalCancelledReservations;
    const cancelRate =
        totalReservations > 0
            ? Math.round((totalCancelled / totalReservations) * 100)
            : 0;

    const reservationsHref =
        selectedHouseId !== "all"
            ? `/home/admin/reservations?houseId=${encodeURIComponent(selectedHouseId)}`
            : "/home/admin/reservations";

    return (
        <div className="space-y-8">
            {/* Header + filtry */}
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                <h2 className="text-2xl font-bold text-gray-900">Statistics</h2>

                <div className="flex flex-wrap gap-3">
                    <select
                        value={selectedHouseId}
                        onChange={(e) => setSelectedHouseId(e.target.value)}
                        className="rounded-xl border border-gray-300 px-3 py-2 bg-white text-gray-700 text-sm outline-none focus:ring-2 focus:ring-blue-500"
                    >
                        <option value="all">All parking lots</option>
                        {stats.map((house) => (
                            <option key={house.parkingHouseId} value={house.parkingHouseId}>
                                {house.address}
                            </option>
                        ))}
                    </select>

                    <select
                        value={days}
                        onChange={(e) => setDays(Number(e.target.value))}
                        className="rounded-xl border border-gray-300 px-3 py-2 bg-white text-gray-700 text-sm outline-none focus:ring-2 focus:ring-blue-500"
                    >
                        <option value={7}>Last 7 days</option>
                        <option value={30}>Last 30 days</option>
                        <option value={90}>Last 90 days</option>
                    </select>

                    <select
                        value={interval}
                        onChange={(e) => setInterval(e.target.value as Interval)}
                        className="rounded-xl border border-gray-300 px-3 py-2 bg-white text-gray-700 text-sm outline-none focus:ring-2 focus:ring-blue-500"
                    >
                        <option value="day">Daily</option>
                        <option value="week">Weekly</option>
                    </select>
                </div>
            </div>

            {/* Souhrnné kartičky */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <Link
                    href={reservationsHref}
                    className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition cursor-pointer"
                >
                    <div className="text-xs uppercase tracking-wide text-gray-500 mb-1">
                        Total reservations
                    </div>
                    <div className="text-3xl font-semibold text-gray-900">
                        {totalReservations}
                    </div>
                    <div className="mt-2 text-xs text-gray-500">Click to view</div>
                </Link>

                <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm">
                    <div className="text-xs uppercase tracking-wide text-gray-500 mb-1">
                        Cancelled
                    </div>
                    <div className="text-3xl font-semibold text-gray-900">
                        {totalCancelled}
                    </div>
                </div>

                <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm">
                    <div className="text-xs uppercase tracking-wide text-gray-500 mb-1">
                        Cancellation rate
                    </div>
                    <div className="text-3xl font-semibold text-gray-900">
                        {cancelRate}%
                    </div>
                </div>
            </div>

            {/* Graf: Reservations vs Cancelled */}
            <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">
                    Reservations over time
                </h3>
                <div className="h-[300px] w-full">
                    <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={chartData}>
                            <CartesianGrid strokeDasharray="3 3" vertical={false} />
                            <XAxis
                                dataKey="label"
                                tickFormatter={formatDateLabel}
                                tick={{ fontSize: 12 }}
                            />
                            <YAxis tick={{ fontSize: 12 }} />
                            <Tooltip labelFormatter={(val) => `From ${formatDateLabel(val)}`} />
                            <Legend />
                            <Area
                                type="monotone"
                                dataKey="reservations"
                                name="Reservations"
                                stroke="#2563eb"
                                fill="#bfdbfe"
                            />
                            <Area
                                type="monotone"
                                dataKey="cancelledReservations"
                                name="Cancelled"
                                stroke="#dc2626"
                                fill="#fecaca"
                            />
                        </AreaChart>
                    </ResponsiveContainer>
                </div>
            </div>
        </div>
    );
}
