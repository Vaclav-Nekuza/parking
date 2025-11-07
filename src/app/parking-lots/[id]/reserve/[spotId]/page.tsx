'use client';

import { useMemo, useState, useEffect } from 'react';
import { useParams, useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';

function pill(cls: string) {
  return `rounded-full px-5 py-2 border font-semibold ${cls}`;
}

function card(cls = '') {
  return `bg-gray-100/70 rounded-2xl p-5 ${cls}`;
}

function czk(v: number) {
  return new Intl.NumberFormat('cs-CZ', { style: 'currency', currency: 'CZK', maximumFractionDigits: 0 }).format(v);
}

const clamp = (n: number, min: number, max: number) => Math.max(min, Math.min(max, n));

export default function SpotDetailPage() {
  const router = useRouter();
  const params = useParams<{ id: string; spotId: string }>();
  const q = useSearchParams();

  const areaName = q.get('name') ?? `Parking area ${params.id}`;
  const spotLabel = params.spotId;
  const mode = (q.get('mode') ?? 'park') as 'park' | 'reserve' | 'active';
  const pricePerHour = Number(q.get('pricePerHour') ?? 40);

  // PARK NOW state
  const [minutes, setMinutes] = useState(15);
  const priceNow = useMemo(() => Math.ceil((minutes / 60) * pricePerHour), [minutes, pricePerHour]);
  const freeUntil = '14:00';

  // PAYMENT
  const [selectedCard, setSelectedCard] = useState('Pre-saved card 1');

  // RESERVE LATER state (lightweight vlastní kalendář + časy)
  const today = useMemo(() => new Date(), []);
  const [monthCursor, setMonthCursor] = useState(new Date(today.getFullYear(), today.getMonth(), 1));
  const [pickedDate, setPickedDate] = useState<Date | null>(today);
  const [fromTime, setFromTime] = useState('08:00');
  const [toTime, setToTime] = useState('08:30');

  const daysInMonth = useMemo(() => {
    const year = monthCursor.getFullYear();
    const month = monthCursor.getMonth();
    const firstDow = new Date(year, month, 1).getDay(); // 0=Sun
    const count = new Date(year, month + 1, 0).getDate();
    const cells: (Date | null)[] = [];
    const pad = (firstDow + 6) % 7; // start Monday
    for (let i = 0; i < pad; i++) cells.push(null);
    for (let d = 1; d <= count; d++) cells.push(new Date(year, month, d));
    return cells;
  }, [monthCursor]);

  // ACTIVE state (odpočet)
  const [leftSec, setLeftSec] = useState(14 * 60); // 14 min demo
  useEffect(() => {
    if (mode !== 'active') return;
    const t = setInterval(() => setLeftSec((s) => Math.max(0, s - 1)), 1000);
    return () => clearInterval(t);
  }, [mode]);

  return (
    <main className="mx-auto max-w-2xl px-4 py-6">
      <h1 className="text-4xl font-extrabold text-gray-600 mb-5">
        {areaName} - <span className="text-gray-700">Spot {spotLabel}</span>
      </h1>

      {/* PARK NOW */}
      {mode === 'park' && (
        <>
          <section className={card()}>
            <p className="text-2xl font-semibold text-gray-800 mb-2">Park now for:</p>

            <div className="flex items-baseline gap-5 mb-1">
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  min={5}
                  step={5}
                  value={minutes}
                  onChange={(e) => setMinutes(clamp(parseInt(e.target.value || '0', 10), 5, 12 * 60))}
                  className="text-blue-600 text-5xl font-bold w-28 bg-transparent outline-none"
                />
                <span className="text-blue-600 text-3xl font-bold">min</span>
              </div>
              <div className="text-4xl text-gray-500 font-semibold">{czk(priceNow)}</div>
            </div>

            <div className="text-green-600 font-medium mb-3">Free until {freeUntil}</div>

            <button
              className={pill('border-green-300 text-green-700 bg-green-50')}
              onClick={() => setMinutes((m) => clamp(m + 15, 5, 12 * 60))}
            >
              Park now
            </button>
          </section>

          <section className="mt-8">
            <h3 className="text-2xl font-bold mb-3">Choose payment method</h3>

            <div className={card('flex flex-col gap-3')}>
              <select
                value={selectedCard}
                onChange={(e) => setSelectedCard(e.target.value)}
                className="rounded-xl px-4 py-2 bg-white text-gray-900"
              >
                <option>Pre-saved card 1</option>
                <option>Pre-saved card 2</option>
                <option>Apple Pay (demo)</option>
              </select>

              <button className={pill('bg-blue-50 border-blue-200 text-blue-600 self-start')}>+ Add new card</button>
            </div>
          </section>

          <footer className="mt-10 flex items-center justify-between">
            <Link href={`/parking-lots/${params.id}/reserve`} className={pill('bg-blue-50 border-blue-200 text-blue-600')}>
              Back
            </Link>
            <button
              className={pill('bg-green-50 border-green-300 text-green-700')}
              onClick={() => router.push(`/parking-lots/${params.id}/reserve/${params.spotId}?mode=active&name=${encodeURIComponent(areaName)}`)}
            >
              Pay &amp; Park
            </button>
          </footer>
        </>
      )}

      {/* RESERVE FOR LATER */}
      {mode === 'reserve' && (
        <>
          <section className={card()}>
            <p className="text-2xl font-semibold text-gray-800 mb-4">Reserve for later:</p>

            <div className="flex flex-col gap-5">
              {/* Calendar */}
              <div className="bg-white rounded-2xl p-4 shadow-sm">
                <div className="flex items-center justify-between mb-2">
                  <button
                    className="px-2 py-1 rounded-lg border text-gray-600"
                    onClick={() =>
                      setMonthCursor(new Date(monthCursor.getFullYear(), monthCursor.getMonth() - 1, 1))
                    }
                  >
                    ◀
                  </button>
                  <div className="font-semibold">
                    {monthCursor.toLocaleString('en-US', { month: 'long', year: 'numeric' })}
                  </div>
                  <button
                    className="px-2 py-1 rounded-lg border text-gray-600"
                    onClick={() =>
                      setMonthCursor(new Date(monthCursor.getFullYear(), monthCursor.getMonth() + 1, 1))
                    }
                  >
                    ▶
                  </button>
                </div>

                <div className="grid grid-cols-7 gap-1 text-center text-xs text-gray-500 mb-2">
                  {['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'].map((d) => (
                    <div key={d}>{d}</div>
                  ))}
                </div>

                <div className="grid grid-cols-7 gap-1">
                  {daysInMonth.map((d, i) => {
                    const isPicked =
                      d &&
                      pickedDate &&
                      d.getFullYear() === pickedDate.getFullYear() &&
                      d.getMonth() === pickedDate.getMonth() &&
                      d.getDate() === pickedDate.getDate();

                    return (
                      <button
                        key={i}
                        disabled={!d}
                        onClick={() => d && setPickedDate(d)}
                        className={[
                          'h-11 rounded-xl text-sm',
                          d ? 'bg-gray-50 hover:bg-blue-50' : 'bg-transparent cursor-default',
                          isPicked ? 'ring-2 ring-blue-400 font-semibold' : '',
                        ].join(' ')}
                      >
                        {d ? d.getDate() : ''}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Times */}
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-white rounded-2xl p-4 shadow-sm text-center">
                  <label className="block text-sm text-gray-500 mb-1">From</label>
                  <input
                    type="time"
                    value={fromTime}
                    onChange={(e) => setFromTime(e.target.value)}
                    className="text-3xl font-bold text-blue-600 bg-transparent outline-none w-full text-center"
                  />
                </div>
                <div className="bg-white rounded-2xl p-4 shadow-sm text-center">
                  <label className="block text-sm text-gray-500 mb-1">To</label>
                  <input
                    type="time"
                    value={toTime}
                    onChange={(e) => setToTime(e.target.value)}
                    className="text-3xl font-bold text-blue-600 bg-transparent outline-none w-full text-center"
                  />
                </div>
              </div>
            </div>
          </section>

          <section className="mt-8">
            <h3 className="text-2xl font-bold mb-3">Choose payment method</h3>
            <div className={card('flex flex-col gap-3')}>
              <select
                value={selectedCard}
                onChange={(e) => setSelectedCard(e.target.value)}
                className="rounded-xl px-4 py-2 bg-white text-gray-900"
              >
                <option>Pre-saved card 1</option>
                <option>Pre-saved card 2</option>
              </select>
              <button className={pill('bg-blue-50 border-blue-200 text-blue-600 self-start')}>+ Add new card</button>
            </div>
          </section>

          <footer className="mt-10 flex items-center justify-between">
            <Link href={`/parking-lots/${params.id}/reserve`} className={pill('bg-blue-50 border-blue-200 text-blue-600')}>
              Back
            </Link>
            <button
              className={pill('bg-green-50 border-green-300 text-green-700')}
              onClick={() => alert(`Reserved ${areaName} - Spot ${spotLabel} on ${pickedDate?.toDateString()} ${fromTime}-${toTime}`)}
            >
              Reserve
            </button>
          </footer>
        </>
      )}

      {/* PARKING IN PROGRESS */}
      {mode === 'active' && (
        <>
          <section className={card()}>
            <p className="text-2xl font-semibold text-gray-800 mb-3">Parking in progress:</p>

            <div className="text-5xl text-blue-600 font-bold mb-1">
              {Math.floor(leftSec / 60)} min {String(leftSec % 60).padStart(2, '0')} left
            </div>
            <div className="text-green-600 font-medium mb-4">Free until {freeUntil}</div>

            <div className="flex gap-4">
              <button className={pill('border-red-300 text-red-700 bg-red-50')} onClick={() => router.back()}>
                Cancel
              </button>
              <button className={pill('border-green-300 text-green-700 bg-green-50')} onClick={() => setLeftSec((s) => s + 15 * 60)}>
                Prolong
              </button>
            </div>
          </section>

          <footer className="mt-10">
            <Link href={`/parking-lots/${params.id}/reserve`} className={pill('bg-blue-50 border-blue-200 text-blue-600')}>
              Back
            </Link>
          </footer>
        </>
      )}
    </main>
  );
}
