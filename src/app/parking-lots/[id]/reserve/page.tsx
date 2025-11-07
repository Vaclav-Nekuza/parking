'use client';

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

function pill(cls: string) {
  return `rounded-full px-4 py-2 border font-semibold ${cls}`;
}

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
    <main className="mx-auto max-w-2xl px-4 py-6">
      <h1 className="text-4xl font-extrabold text-gray-600 mb-5">{areaName}</h1>

      <h2 className="text-xl font-semibold text-gray-900 mb-3">Parking spots:</h2>

      <div className="space-y-4">
        {spots.map((s) => {
          const leftBadge =
            s.status.state === 'free-now'
              ? { text: 'Park now', cls: 'text-green-600 border-green-300 bg-green-50' }
              : { text: 'Park now', cls: 'text-green-400 border-green-200 bg-green-50/40 pointer-events-none opacity-60' };

        const sub =
            s.status.state === 'free-now'
              ? `Free until ${s.status.freeUntil}`
              : `Free from ${s.status.freeFrom}`;

          return (
            <div key={s.id} className="flex items-center justify-between gap-3 bg-gray-100/70 rounded-2xl px-4 py-3">
              <div className="text-3xl font-semibold w-8">{s.label}</div>

              <div className="flex items-center gap-3 flex-1">
                <Link
                  href={{
                    pathname: `/parking-lots/${params.id}/reserve/${s.id}`,
                    query: { mode: 'park', name: areaName, pricePerHour },
                  }}
                  className={pill(`${leftBadge.cls}`)}
                >
                  {leftBadge.text}
                </Link>
                <span className="text-sm text-gray-500">{sub}</span>
              </div>

              <Link
                href={{
                  pathname: `/parking-lots/${params.id}/reserve/${s.id}`,
                  query: { mode: 'reserve', name: areaName, pricePerHour },
                }}
                className={pill('bg-blue-50 border-blue-200 text-blue-600')}
              >
                Reserve for later
              </Link>
            </div>
          );
        })}
      </div>

      <div className="mt-10">
        <Link href="/parking-lots" className={pill('bg-blue-50 border-blue-200 text-blue-600')}>
          Back
        </Link>
      </div>
    </main>
  );
}
