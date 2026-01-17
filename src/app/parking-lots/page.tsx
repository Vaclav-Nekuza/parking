"use client";

import { useState, useEffect } from "react";
import Link from 'next/link';
import { withAuth } from '../components/auth/withAuth';
import { useSession } from '../contexts/session-context';

type ParkingHouse = {
    id: string;
    adminId: string;
    address: string;
    price: number;
    createdAt: string;
    totalSlots: number;
    freeSlots: number;
};

type ActiveReservation = {
    id: string;
    start: string;
    end: string;
    parkSlotId: string;
    parkingHouse: {
        id: string;
        address: string;
        price: number;
    };
    // Derived timing fields from API
    serverNow?: string;
    graceEndsAt?: string;
    phase?: 'active' | 'grace';
    endingSoon?: boolean;
};

function ParkingLotsPageComponent() {
    const { logout } = useSession();
    const [parkingHouses, setParkingHouses] = useState<ParkingHouse[]>([]);
    const [activeReservations, setActiveReservations] = useState<ActiveReservation[]>([]);
    const [loading, setLoading] = useState(true);
    const [loadingReservations, setLoadingReservations] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        async function fetchParkingHouses() {
            try {
                const response = await fetch('/api/parkinglots');
                if (!response.ok) {
                    throw new Error('Failed to fetch parking houses');
                }
                const data = await response.json();
                setParkingHouses(data);
            } catch (err) {
                setError(err instanceof Error ? err.message : 'An error occurred');
            } finally {
                setLoading(false);
            }
        }

        async function fetchActiveReservations() {
            try {
                setLoadingReservations(true);
                const response = await fetch('/api/reservation/my-active');
                if (response.ok) {
                    const data = await response.json();
                    setActiveReservations(data);
                }
            } catch (err) {
                console.error('Failed to fetch active reservations:', err);
            } finally {
                setLoadingReservations(false);
            }
        }

        fetchParkingHouses();
        fetchActiveReservations();
    }, []);

    // Refresh availability every 15 seconds
    useEffect(() => {
        async function refreshAvailability() {
            try {
                const response = await fetch('/api/parkinglots/availability');
                if (!response.ok) return;
                
                const availability: Array<{ id: string; totalSlots: number; freeSlots: number }> = await response.json();
                
                setParkingHouses(prevHouses => 
                    prevHouses.map(house => {
                        const updated = availability.find(a => a.id === house.id);
                        return updated 
                            ? { ...house, totalSlots: updated.totalSlots, freeSlots: updated.freeSlots }
                            : house;
                    })
                );
            } catch (err) {
                // Silently fail to avoid disrupting user experience
                console.error('Failed to refresh availability:', err);
            }
        }

        const interval = setInterval(refreshAvailability, 15000);
        return () => clearInterval(interval);
    }, []);

    function formatDate(dateString: string): string {
        return new Date(dateString).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric'
        });
    }

    function formatTime(dateString: string): string {
        return new Date(dateString).toLocaleTimeString('en-US', {
            hour: '2-digit',
            minute: '2-digit'
        });
    }

    function getTimeRemaining(endDate: string, graceEndsAt?: string, phase?: 'active' | 'grace'): string {
        const now = new Date();
        const target = phase === 'grace' && graceEndsAt ? new Date(graceEndsAt) : new Date(endDate);
        const diffMs = target.getTime() - now.getTime();

        if (diffMs <= 0) return 'Expired';

        const diffMins = Math.floor(diffMs / 60000);
        const hours = Math.floor(diffMins / 60);
        const mins = diffMins % 60;

        if (hours > 0) {
            return `${hours}h ${mins}m left`;
        }
        return `${mins}m left`;
    }

    return (
        <main className="min-h-screen bg-white">
            <div className="max-w-4xl mx-auto px-6 py-10">
                <div className="flex justify-between items-start mb-8">
                    <div>
                        <h1 className="text-5xl leading-tight font-extrabold tracking-tight text-black mb-1">
                            Available parking houses
                        </h1>
                        <p className="text-gray-500">
                            Find the perfect parking spot for your needs
                        </p>
                    </div>
                    <button
                        onClick={() => logout()}
                        className="rounded-2xl px-6 py-2 bg-red-500 text-white font-medium hover:opacity-90 transition-opacity"
                    >
                        Logout
                    </button>
                </div>

                {loadingReservations && (
                    <div className="mb-8 bg-gray-50 border border-gray-200 rounded-2xl p-6">
                        <div className="text-center py-4 text-gray-500">Loading your reservations...</div>
                    </div>
                )}

                {!loadingReservations && activeReservations.length === 0 && (
                    <div className="mb-8 bg-gray-50 border border-gray-200 rounded-2xl p-6">
                        <div className="text-center py-4 text-gray-500">You don&apos;t have any active reservations</div>
                    </div>
                )}

                {!loadingReservations && activeReservations.length > 0 && (
                    <div className="mb-8 bg-blue-50 border border-blue-200 rounded-2xl p-6">
                        <h2 className="text-2xl font-bold text-black mb-4">Your Active Reservations</h2>
                        <div className="space-y-3">
                            {activeReservations.map((reservation) => {
                                const isParkingNow = new Date(reservation.start) <= new Date();
                                
                                return (
                                    <Link
                                        key={reservation.id}
                                        href={{
                                            pathname: `/parking-lots/${reservation.parkingHouse.id}/reserve/${reservation.parkSlotId}`,
                                            query: {
                                                mode: 'active',
                                                name: reservation.parkingHouse.address,
                                                pricePerHour: reservation.parkingHouse.price,
                                                spotLabel: 'Reserved',
                                                reservationId: reservation.id
                                            }
                                        }}
                                        className="block bg-white rounded-2xl p-4 hover:shadow-md transition-shadow"
                                    >
                                        <div className="flex justify-between items-start">
                                            <div>
                                                <div className="font-semibold text-black mb-1">
                                                    {reservation.parkingHouse.address}
                                                </div>
                                                <div className="text-sm text-gray-600">
                                                    {isParkingNow ? (
                                                        <>Parking until {formatTime(reservation.end)}</>
                                                    ) : (
                                                        <>Reserved: {formatDate(reservation.start)} • {formatTime(reservation.start)} - {formatTime(reservation.end)}</>
                                                    )}
                                                </div>
                                            </div>
                                            <div className="text-right">
                                                {isParkingNow ? (
                                                    <>
                                                        {reservation.phase === 'grace' && (
                                                            <div className="text-orange-600 font-semibold text-xs mb-1">Grace period</div>
                                                        )}
                                                        {reservation.endingSoon && reservation.phase === 'active' && (
                                                            <div className="text-red-600 font-semibold text-xs mb-1">Ending in under 5 minutes</div>
                                                        )}
                                                        <div className={`${reservation.phase === 'grace' ? 'text-orange-600' : 'text-green-600'} font-semibold text-sm`}>
                                                            {getTimeRemaining(reservation.end, reservation.graceEndsAt, reservation.phase)}
                                                        </div>
                                                    </>
                                                ) : (
                                                    <div className="text-blue-600 font-semibold text-sm">
                                                        Upcoming
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    </Link>
                                );
                            })}
                        </div>
                    </div>
                )}

                {loading && (
                    <div className="flex justify-center items-center py-12">
                        <div className="text-gray-500 text-lg">Loading parking houses...</div>
                    </div>
                )}

                {error && (
                    <div className="bg-red-50 border border-red-200 rounded-2xl px-6 py-4 mb-6">
                        <p className="text-red-600 font-medium">Error: {error}</p>
                    </div>
                )}

                {!loading && !error && parkingHouses.length === 0 && (
                    <div className="text-center py-12">
                        <div className="text-gray-400 text-xl mb-4">No parking houses available</div>
                        <p className="text-gray-500">Check back later for new parking opportunities.</p>
                    </div>
                )}

                {!loading && !error && parkingHouses.length > 0 && (
                    <div className="space-y-6">
                        {parkingHouses.map((house) => (
                            <div
                                key={house.id}
                                className="bg-white border border-gray-200 rounded-2xl p-6 hover:shadow-lg transition-shadow duration-200"
                            >
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-start">
                                    <div className="md:col-span-2">
                                        <div className="text-sm font-medium text-gray-700 mb-1">
                                            Address
                                        </div>
                                        <div className="text-xl font-semibold text-black mb-2">
                                            {house.address}
                                        </div>
                                        <div className="flex items-center gap-4 text-sm">
                                            <span className="text-gray-500">
                                                Added: {formatDate(house.createdAt)}
                                            </span>
                                            <span className={`font-medium ${house.freeSlots > 0 ? 'text-green-600' : 'text-red-600'}`}>
                                                Availability: {house.freeSlots}/{house.totalSlots}
                                            </span>
                                        </div>
                                    </div>

                                    <div className="flex flex-col items-start md:items-end">
                                        <div className="text-sm font-medium text-gray-700 mb-1">
                                            Price per hour
                                        </div>
                                        <div className="text-2xl font-bold text-black mb-2">
                                            {house.price} CZK
                                        </div>
                                        <Link 
                                            href={{
                                                pathname: `/parking-lots/${house.id}/reserve`,
                                                query: { name: house.address, pricePerHour: house.price }
                                            }}
                                            className="rounded-2xl px-6 py-2 bg-blue-400 text-white font-medium hover:opacity-90 transition-opacity"
                                        >
                                            Book Now
                                        </Link>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </main>
    );
}

export default withAuth(ParkingLotsPageComponent, { requiredRole: 'driver' });