"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";

import { withAuth } from "../../../components/auth/withAuth";
import AdminCancelReservationButton from "../../../components/reservations/AdminCancelReservationButton";

type ParkingLot = {
    id: string;
    address: string;
    price: number;
};

type SpotStatus =
    | { state: "free-now"; freeUntil: string | null }
    | { state: "busy"; freeFrom: string; reservationId: string; driverId: string };

type Spot = {
    id: string;
    label: string;
    status: SpotStatus;
};

type SlotsApiResponse = {
    parkingHouse: { id: string; address: string; pricePerHour: number };
    slots: Spot[];
};

function AdminReservationsPage() {
    const searchParams = useSearchParams();
    const preselectHouseId = searchParams.get("houseId") ?? "";

    const [lots, setLots] = useState<ParkingLot[]>([]);
    const [lotsLoading, setLotsLoading] = useState(true);
    const [lotsError, setLotsError] = useState<string | null>(null);

    const [selectedLotId, setSelectedLotId] = useState<string>("");
    const [slotsLoading, setSlotsLoading] = useState(false);
    const [slotsError, setSlotsError] = useState<string | null>(null);
    const [slots, setSlots] = useState<Spot[]>([]);
    const [parkingHouseMeta, setParkingHouseMeta] =
        useState<SlotsApiResponse["parkingHouse"] | null>(null);

    useEffect(() => {
        const loadLots = async () => {
            try {
                setLotsLoading(true);
                setLotsError(null);

                const res = await fetch("/api/parking-lots?scope=mine", {
                    cache: "no-store",
                    headers: { Pragma: "no-cache" },
                });

                if (!res.ok) {
                    const body = await res.json().catch(() => null);
                    throw new Error(body?.error || "Failed to load parking lots");
                }

                const data = (await res.json()) as ParkingLot[];
                setLots(data);

                if (data.length > 0) {
                    const preferred =
                        preselectHouseId && data.some((l) => l.id === preselectHouseId)
                            ? preselectHouseId
                            : data[0].id;
                    setSelectedLotId(preferred);
                }
            } catch (e: unknown) {
                setLotsError(
                    e instanceof Error ? e.message : "Failed to load parking lots"
                );
            } finally {
                setLotsLoading(false);
            }
        };

        loadLots();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    useEffect(() => {
        const loadSlots = async () => {
            if (!selectedLotId) return;

            try {
                setSlotsLoading(true);
                setSlotsError(null);

                const res = await fetch(`/api/parking-lots/${selectedLotId}/slots`, {
                    cache: "no-store",
                    headers: { Pragma: "no-cache" },
                });

                if (!res.ok) {
                    const body = await res.json().catch(() => null);
                    throw new Error(body?.error || "Failed to load slots");
                }

                const data = (await res.json()) as SlotsApiResponse;
                setParkingHouseMeta(data.parkingHouse);
                setSlots(data.slots);
            } catch (e: unknown) {
                setSlotsError(e instanceof Error ? e.message : "Failed to load slots");
            } finally {
                setSlotsLoading(false);
            }
        };

        loadSlots();
    }, [selectedLotId]);

    const busySlots = useMemo(() => {
        return slots.filter((s) => s.status.state === "busy") as Array<
            Spot & { status: Extract<SpotStatus, { state: "busy" }> }
        >;
    }, [slots]);

    return (
        <main className="min-h-screen bg-white">
            <div className="max-w-3xl mx-auto px-6 py-10">
                <div className="mb-6">
                    <Link
                        href="/home/admin"
                        className="inline-flex items-center rounded-2xl px-5 py-2 border border-gray-300 text-gray-700 font-medium hover:opacity-90"
                    >
                        Back to dashboard
                    </Link>
                </div>

                <h1 className="text-3xl font-bold text-black mb-2">Reservations</h1>
                <p className="text-gray-600 mb-6">
                    Přehled aktuálních rezervací (busy slotů) pro tvoje parking lots.
                </p>

                {lotsLoading && (
                    <div className="text-gray-500">Loading parking lots...</div>
                )}
                {lotsError && (
                    <div className="bg-red-100 text-red-700 p-4 rounded-2xl mb-4">
                        {lotsError}
                    </div>
                )}

                {!lotsLoading && !lotsError && lots.length > 0 && (
                    <div className="bg-gray-100 rounded-2xl p-6 mb-6">
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Parking lot
                        </label>
                        <select
                            className="w-full rounded-xl border border-gray-300 px-4 py-2 bg-white"
                            value={selectedLotId}
                            onChange={(e) => setSelectedLotId(e.target.value)}
                        >
                            {lots.map((l) => (
                                <option key={l.id} value={l.id}>
                                    {l.address} ({l.id})
                                </option>
                            ))}
                        </select>

                        {parkingHouseMeta && (
                            <div className="mt-3 text-sm text-gray-600">
                                {parkingHouseMeta.address} • {parkingHouseMeta.pricePerHour} CZK/hour
                            </div>
                        )}
                    </div>
                )}

                {slotsLoading && (
                    <div className="text-gray-500">Loading reservations...</div>
                )}
                {slotsError && (
                    <div className="bg-red-100 text-red-700 p-4 rounded-2xl mb-4">
                        {slotsError}
                    </div>
                )}

                {!slotsLoading && !slotsError && selectedLotId && (
                    <div className="space-y-3">
                        {busySlots.length === 0 ? (
                            <div className="text-gray-600">
                                Žádné aktivní rezervace (busy sloty) pro vybraný parking lot.
                            </div>
                        ) : (
                            busySlots.map((s) => (
                                <div
                                    key={s.id}
                                    className="border border-gray-200 rounded-2xl p-4 flex items-center justify-between gap-4"
                                >
                                    <div>
                                        <div className="font-semibold">Spot {s.label}</div>
                                        <div className="text-sm text-gray-600">
                                            reservationId: {s.status.reservationId}
                                        </div>
                                        <div className="text-sm text-gray-600">
                                            driverId: {s.status.driverId}
                                        </div>
                                        <div className="text-sm text-gray-600">
                                            freeFrom:{" "}
                                            {new Date(s.status.freeFrom).toLocaleString("cs-CZ")}
                                        </div>
                                    </div>

                                    <AdminCancelReservationButton
                                        reservationId={s.status.reservationId}
                                    />
                                </div>
                            ))
                        )}
                    </div>
                )}
            </div>
        </main>
    );
}

export default withAuth(AdminReservationsPage, { requiredRole: "admin" });
