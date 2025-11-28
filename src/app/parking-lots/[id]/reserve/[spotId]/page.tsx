"use client";

import { useMemo, useState, useEffect } from 'react';
import { useParams, useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';



function czk(v: number) {
  return new Intl.NumberFormat('cs-CZ', { style: 'currency', currency: 'CZK', maximumFractionDigits: 0 }).format(v);
}

const clamp = (n: number, min: number, max: number) => Math.max(min, Math.min(max, n));

export default function SpotDetailPage() {
  const router = useRouter();
  const params = useParams<{ id: string; spotId: string }>();
  const q = useSearchParams();

  const areaName = q.get('name') ?? `Parking area ${params.id}`;
  const spotLabel = q.get('spotLabel') ?? params.spotId;
  const mode = (q.get('mode') ?? 'park') as 'park' | 'reserve' | 'active';
  const pricePerHour = Number(q.get('pricePerHour') ?? 40);
  const reservationId = q.get('reservationId'); // For active mode

  // PARK NOW state
  const [minutes, setMinutes] = useState(15);
  const priceNow = useMemo(() => Math.ceil((minutes / 60) * pricePerHour), [minutes, pricePerHour]);
  const freeUntil = '14:00';

  // PAYMENT
  const [selectedCard, setSelectedCard] = useState('Pre-saved card 1');

  // API state
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [apiError, setApiError] = useState<string | null>(null);

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

  // Handler for creating reservation (Park Now)
  const handleParkNow = async () => {
    setIsSubmitting(true);
    setApiError(null);

    try {
      const now = new Date();
      const endTime = new Date(now.getTime() + minutes * 60 * 1000);

      const response = await fetch('/api/reservation/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          parkSlotId: params.spotId,
          start: now.toISOString(),
          end: endTime.toISOString(),
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to create reservation');
      }

      const data = await response.json();
      const newReservationId = data.reservation.id;

      // Redirect to active parking page
      router.push(`/parking-lots/${params.id}/reserve/${params.spotId}?mode=active&name=${encodeURIComponent(areaName)}&pricePerHour=${pricePerHour}&spotLabel=${encodeURIComponent(spotLabel)}&reservationId=${newReservationId}`);
    } catch (err) {
      setApiError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handler for creating reservation (Reserve Later)
  const handleReserveLater = async () => {
    if (!pickedDate) {
      setApiError('Please select a date');
      return;
    }

    setIsSubmitting(true);
    setApiError(null);

    try {
      // Combine date and time
      const [fromHour, fromMin] = fromTime.split(':').map(Number);
      const [toHour, toMin] = toTime.split(':').map(Number);

      const startDate = new Date(pickedDate);
      startDate.setHours(fromHour, fromMin, 0, 0);

      const endDate = new Date(pickedDate);
      endDate.setHours(toHour, toMin, 0, 0);

      // Validate time range
      if (startDate >= endDate) {
        setApiError('End time must be after start time');
        return;
      }

      const response = await fetch('/api/reservation/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          parkSlotId: params.spotId,
          start: startDate.toISOString(),
          end: endDate.toISOString(),
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to create reservation');
      }

      const data = await response.json();
      
      // Show success message and redirect
      alert(`Reservation confirmed for ${areaName} - Spot ${spotLabel} on ${pickedDate.toDateString()} from ${fromTime} to ${toTime}`);
      router.push(`/parking-lots/${params.id}/reserve`);
    } catch (err) {
      setApiError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handler for canceling reservation
  const handleCancelReservation = async () => {
    if (!reservationId) {
      setApiError('No reservation ID found');
      return;
    }

    if (!confirm('Are you sure you want to cancel this reservation?')) {
      return;
    }

    setIsSubmitting(true);
    setApiError(null);

    try {
      const response = await fetch(`/api/reservation/${reservationId}`, {
        method: 'POST',
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to cancel reservation');
      }

      // Redirect back to parking lot list
      router.push(`/parking-lots/${params.id}/reserve`);
    } catch (err) {
      setApiError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setIsSubmitting(false);
    }
  };

  useEffect(() => {
    if (mode !== 'active') return;
    const t = setInterval(() => setLeftSec((s) => Math.max(0, s - 1)), 1000);
    return () => clearInterval(t);
  }, [mode]);

  return (
    <main className="min-h-screen bg-white">
      <div className="max-w-xl mx-auto px-6 py-10">
        {/* Hlavní nadpis + podnadpis (stejný styl, jen pro desktop centrovaný blok) */}
        <h1 className="text-5xl leading-tight font-extrabold tracking-tight text-black mb-1">
          {mode === 'park' && 'Park'}
          {mode === 'reserve' && 'Reserve'}
          {mode === 'active' && 'Parking'}
          <br />
          spot {spotLabel}
        </h1>
        <p className="text-gray-500 mb-8">
          {areaName} • {pricePerHour} CZK/hour
        </p>

        {/* Error message */}
        {apiError && (
          <div className="bg-red-100 text-red-700 p-4 rounded-2xl mb-4">
            {apiError}
          </div>
        )}

        {/* PARK NOW */}
        {mode === 'park' && (
          <>
            <section className="bg-gray-100 rounded-2xl p-6 mb-6">
              <h2 className="text-2xl font-semibold text-black mb-4">Park now for:</h2>

              <div className="flex items-baseline gap-5 mb-4">
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

              <div className="text-green-600 font-medium mb-4">Free until {freeUntil}</div>

              <button
                className="rounded-2xl px-6 py-3 bg-green-500 text-white font-medium hover:opacity-90"
                onClick={() => setMinutes((m) => clamp(m + 15, 5, 12 * 60))}
              >
                Add 15 min
              </button>
            </section>

            <section className="bg-gray-100 rounded-2xl p-6">
              <h3 className="text-xl font-semibold text-black mb-4">Choose payment method</h3>

              <div className="space-y-4">
                <select
                  value={selectedCard}
                  onChange={(e) => setSelectedCard(e.target.value)}
                  className="w-full bg-white rounded-2xl px-4 py-3 text-black outline-none"
                >
                  <option>Pre-saved card 1</option>
                  <option>Pre-saved card 2</option>
                  <option>Apple Pay (demo)</option>
                </select>

                <button className="rounded-2xl px-6 py-3 border border-blue-300 text-blue-600 bg-blue-50 hover:bg-blue-100 font-medium">
                  + Add new card
                </button>
              </div>
            </section>

            <div className="flex items-center justify-between pt-8">
              <Link 
                href={`/parking-lots/${params.id}/reserve`} 
                className="rounded-2xl px-8 py-3 border border-gray-300 text-gray-700 font-medium hover:opacity-90"
              >
                Back
              </Link>
              <button
                className="rounded-2xl px-8 py-3 bg-blue-400 text-white font-medium hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed"
                onClick={handleParkNow}
                disabled={isSubmitting}
              >
                {isSubmitting ? 'Processing...' : 'Pay & Park'}
              </button>
            </div>
          </>
        )}

        {/* RESERVE FOR LATER */}
        {mode === 'reserve' && (
          <>
            <section className="bg-gray-100 rounded-2xl p-6 mb-6">
              <h2 className="text-2xl font-semibold text-black mb-6">Reserve for later:</h2>

              <div className="space-y-6">
                {/* Calendar */}
                <div className="bg-white rounded-2xl p-4">
                  <div className="flex items-center justify-between mb-4">
                    <button
                      className="w-10 h-10 rounded-xl border border-gray-300 flex items-center justify-center text-gray-600 hover:bg-gray-50"
                      onClick={() =>
                        setMonthCursor(new Date(monthCursor.getFullYear(), monthCursor.getMonth() - 1, 1))
                      }
                    >
                      ◀
                    </button>
                    <div className="font-semibold text-lg">
                      {monthCursor.toLocaleString('en-US', { month: 'long', year: 'numeric' })}
                    </div>
                    <button
                      className="w-10 h-10 rounded-xl border border-gray-300 flex items-center justify-center text-gray-600 hover:bg-gray-50"
                      onClick={() =>
                        setMonthCursor(new Date(monthCursor.getFullYear(), monthCursor.getMonth() + 1, 1))
                      }
                    >
                      ▶
                    </button>
                  </div>

                  <div className="grid grid-cols-7 gap-1 text-center text-xs text-gray-500 mb-2">
                    {['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'].map((d) => (
                      <div key={d} className="py-2">{d}</div>
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
                            'h-11 rounded-xl text-sm font-medium',
                            d ? 'bg-gray-50 hover:bg-blue-50' : 'bg-transparent cursor-default',
                            isPicked ? 'bg-blue-400 text-white' : '',
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
                  <div className="bg-white rounded-2xl p-4 text-center">
                    <label className="block text-sm font-medium text-gray-700 mb-2">From</label>
                    <input
                      type="time"
                      value={fromTime}
                      onChange={(e) => setFromTime(e.target.value)}
                      className="text-2xl font-bold text-blue-600 bg-transparent outline-none w-full text-center"
                    />
                  </div>
                  <div className="bg-white rounded-2xl p-4 text-center">
                    <label className="block text-sm font-medium text-gray-700 mb-2">To</label>
                    <input
                      type="time"
                      value={toTime}
                      onChange={(e) => setToTime(e.target.value)}
                      className="text-2xl font-bold text-blue-600 bg-transparent outline-none w-full text-center"
                    />
                  </div>
                </div>
              </div>
            </section>

            <section className="bg-gray-100 rounded-2xl p-6">
              <h3 className="text-xl font-semibold text-black mb-4">Choose payment method</h3>
              <div className="space-y-4">
                <select
                  value={selectedCard}
                  onChange={(e) => setSelectedCard(e.target.value)}
                  className="w-full bg-white rounded-2xl px-4 py-3 text-black outline-none"
                >
                  <option>Pre-saved card 1</option>
                  <option>Pre-saved card 2</option>
                </select>
                <button className="rounded-2xl px-6 py-3 border border-blue-300 text-blue-600 bg-blue-50 hover:bg-blue-100 font-medium">
                  + Add new card
                </button>
              </div>
            </section>

            <div className="flex items-center justify-between pt-8">
              <Link 
                href={`/parking-lots/${params.id}/reserve`} 
                className="rounded-2xl px-8 py-3 border border-gray-300 text-gray-700 font-medium hover:opacity-90"
              >
                Back
              </Link>
              <button
                className="rounded-2xl px-8 py-3 bg-blue-400 text-white font-medium hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed"
                onClick={handleReserveLater}
                disabled={isSubmitting}
              >
                {isSubmitting ? 'Processing...' : 'Reserve'}
              </button>
            </div>
          </>
        )}

        {/* PARKING IN PROGRESS */}
        {mode === 'active' && (
          <>
            <section className="bg-gray-100 rounded-2xl p-6">
              <h2 className="text-2xl font-semibold text-black mb-4">Parking in progress:</h2>

              <div className="text-5xl text-blue-600 font-bold mb-2">
                {Math.floor(leftSec / 60)} min {String(leftSec % 60).padStart(2, '0')} left
              </div>
              <div className="text-green-600 font-medium mb-6">Free until {freeUntil}</div>

              <div className="flex gap-4">
                <button 
                  className="rounded-2xl px-6 py-3 border border-red-300 text-red-600 bg-red-50 hover:bg-red-100 font-medium disabled:opacity-50 disabled:cursor-not-allowed" 
                  onClick={handleCancelReservation}
                  disabled={isSubmitting}
                >
                  {isSubmitting ? 'Cancelling...' : 'Cancel'}
                </button>
                <button 
                  className="rounded-2xl px-6 py-3 bg-green-500 text-white font-medium hover:opacity-90" 
                  onClick={() => setLeftSec((s) => s + 15 * 60)}
                >
                  Prolong
                </button>
              </div>
            </section>

            <div className="flex justify-start pt-8">
              <Link 
                href={`/parking-lots/${params.id}/reserve`} 
                className="rounded-2xl px-8 py-3 border border-gray-300 text-gray-700 font-medium hover:opacity-90"
              >
                Back
              </Link>
            </div>
          </>
        )}
      </div>
    </main>
  );
}
