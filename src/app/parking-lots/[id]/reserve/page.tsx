"use client";

import { useMemo } from 'react';
import Link from 'next/link';
import { useParams, useSearchParams } from 'next/navigation';

type SpotStatus =
  | { state: 'free-now'; freeUntil: string }     // např. "14:00"
  | { state: 'busy';     freeFrom: string }      // např. "15:45"
  | { state: 'free-from'; freeFrom: string };    // pro pozdější uvolnění (pondělí atp.)

type Spot = {
  id: string;
  label: string;               // „1“, „2“, …
  status: SpotStatus;
};



export default function ReserveAreaPage() {
  const params = useParams<{ id: string }>();
  const search = useSearchParams();

  const areaName = search.get('name') ?? `Parking area ${params.id}`;
  const pricePerHour = Number(search.get('pricePerHour') ?? 40); // CZK/h

  // demo data – v produkci nahraď voláním na API podle params.id
  const spots: Spot[] = useMemo(
    () => [
      { id: '1', label: '1', status: { state: 'free-now', freeUntil: '14:00' } },
      { id: '2', label: '2', status: { state: 'busy', freeFrom: '15:45' } },
      { id: '3', label: '3', status: { state: 'busy', freeFrom: '20:45' } },
      { id: '4', label: '4', status: { state: 'free-from', freeFrom: '8:00 Mon' } },
    ],
    []
  );

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

        <div className="space-y-4">
          {spots.map((spot) => {
            const isAvailableNow = spot.status.state === 'free-now';
            
            const statusText = 
              spot.status.state === 'free-now' 
                ? `Free until ${spot.status.freeUntil}`
                : `Free from ${spot.status.freeFrom}`;

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
                      <div className="text-lg font-semibold">
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
                      query: { mode: 'park', name: areaName, pricePerHour },
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
                      query: { mode: 'reserve', name: areaName, pricePerHour },
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
