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
};

function ParkingLotsPageComponent() {
    const { logout } = useSession();
    const [parkingHouses, setParkingHouses] = useState<ParkingHouse[]>([]);
    const [loading, setLoading] = useState(true);
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

        fetchParkingHouses();
    }, []);

    function formatDate(dateString: string): string {
        return new Date(dateString).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric'
        });
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
                                        <div className="text-sm text-gray-500">
                                            Added: {formatDate(house.createdAt)}
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

                                <div className="mt-4 pt-4 border-t border-gray-100">
                                    <div className="text-xs text-gray-400">
                                        Admin ID: {house.adminId}
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