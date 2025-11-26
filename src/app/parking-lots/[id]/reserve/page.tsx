"use client";

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useParams, useSearchParams } from 'next/navigation';

type SpotStatus =
  | { state: 'free-now'; freeUntil: string | null }
  | { state: 'busy';     freeFrom: string };

type Spot = {
  id: string;
  label: string;
  status: SpotStatus;
};

type ParkingHouse = {
  id: string;
  address: string;
  pricePerHour: number;
};

type ApiResponse = {
  parkingHouse: ParkingHouse;
  slots: Spot[];
};



export default function ReserveAreaPage() {
  const params = useParams<{ id: string }>();
  const search = useSearchParams();

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [spots, setSpots] = useState<Spot[]>([]);
  const [parkingHouse, setParkingHouse] = useState<ParkingHouse | null>(null);

  const areaName = parkingHouse?.address ?? search.get('name') ?? `Parking area ${params.id}`;
  const pricePerHour = parkingHouse?.pricePerHour ?? Number(search.get('pricePerHour') ?? 40);

  useEffect(() => {
    const fetchSlots = async () => {
      try {
        setLoading(true);
        const response = await fetch(`/api/parking-lots/${params.id}/slots`);
        
        if (!response.ok) {
          throw new Error('Failed to fetch parking slots');
        }

        const data: ApiResponse = await response.json();
        setParkingHouse(data.parkingHouse);
        setSpots(data.slots);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An error occurred');
      } finally {
        setLoading(false);
      }
    };

    fetchSlots();
  }, [params.id]);

  // Helper function to format the status text
  const formatStatusText = (status: SpotStatus): string => {
    if (status.state === 'free-now') {
      if (status.freeUntil) {
        const date = new Date(status.freeUntil);
        return `Free until ${date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}`;
      }
      return 'Available';
    } else {
      const date = new Date(status.freeFrom);
      return `Free from ${date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}`;
    }
  };

  return (
    <main className="min-h-screen bg-white">
      <div className="max-w-xl mx-auto px-6 py-10">
        {/* Hlavní nadpis + podnadpis (stejný styl, jen pro desktop centrovaný blok) */}
        <h1 className="text-5xl leading-tight font-extrabold tracking-tight text-black mb-1">
          Reserve
          <br />
          parking spot
        </h1>
        <p className="text-gray-500 mb-8">
          {areaName} • {pricePerHour} CZK/hour
        </p>

        {loading && (
          <div className="text-center py-8 text-gray-500">Loading parking spots...</div>
        )}

        {error && (
          <div className="bg-red-100 text-red-700 p-4 rounded-2xl mb-4">
            Error: {error}
          </div>
        )}

        <div className="space-y-4">
          {spots.map((spot) => {
            const isAvailableNow = spot.status.state === 'free-now';
            const statusText = formatStatusText(spot.status);

            return (
              <div 
                key={spot.id} 
                className="bg-gray-100 rounded-2xl p-6"
              >
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center text-xl font-bold">
                      {spot.label}
                    </div>
                    <div>
                      <div className="text-lg text-gray-600 font-semibold">
                        Spot {spot.label}
                      </div>
                      <div className="text-sm text-gray-600">
                        {statusText}
                      </div>
                    </div>
                  </div>
                  {isAvailableNow && (
                    <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                  )}
                </div>

                <div className="flex gap-3">
                  <Link
                    href={{
                      pathname: `/parking-lots/${params.id}/reserve/${spot.id}`,
                      query: { mode: 'park', name: areaName, pricePerHour, spotLabel: spot.label },
                    }}
                    className={`rounded-2xl px-6 py-3 font-medium ${
                      isAvailableNow
                        ? 'bg-green-500 text-white hover:opacity-90'
                        : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                    }`}
                  >
                    Park now
                  </Link>
                  <Link
                    href={{
                      pathname: `/parking-lots/${params.id}/reserve/${spot.id}`,
                      query: { mode: 'reserve', name: areaName, pricePerHour, spotLabel: spot.label },
                    }}
                    className="rounded-2xl px-6 py-3 bg-blue-400 text-white font-medium hover:opacity-90"
                  >
                    Reserve for later
                  </Link>
                </div>
              </div>
            );
          })}
        </div>

        {/* Back button */}
        <div className="flex justify-start pt-8">
          <Link 
            href="/parking-lots" 
            className="rounded-2xl px-8 py-3 border border-gray-300 text-gray-700 font-medium hover:opacity-90"
          >
            Back to areas
          </Link>
        </div>
      </div>
    </main>
  );
}
