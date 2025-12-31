"use client";

import { useMemo, useState, useEffect } from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";

function czk(v: number) {
  return new Intl.NumberFormat("cs-CZ", {
    style: "currency",
    currency: "CZK",
    maximumFractionDigits: 0,
  }).format(v);
}

const clamp = (n: number, min: number, max: number) =>
  Math.max(min, Math.min(max, n));


type ReservationDetail = {
  id: string;
  start: string;
  end: string;
  serverNow?: string;
  graceEndsAt?: string;
  phase?: 'active' | 'grace' | 'expired' | 'cancelled';
  endingSoon?: boolean;
};

export default function SpotDetailPage() {
  const router = useRouter();
  const params = useParams<{ id: string; spotId: string }>();
  const q = useSearchParams();

  const areaName = q.get("name") ?? `Parking area ${params.id}`;
  const spotLabel = q.get("spotLabel") ?? params.spotId;
  const mode = (q.get("mode") ?? "park") as "park" | "reserve" | "active";
  const pricePerHour = Number(q.get("pricePerHour") ?? 40);
  const reservationId = q.get("reservationId"); // active mode

  // PARK NOW state
  const [minutes, setMinutes] = useState(15);
  const priceNow = useMemo(
    () => Math.ceil((minutes / 60) * pricePerHour),
    [minutes, pricePerHour]
  );
  const freeUntilStatic = "14:00";

  // PAYMENT
  const [selectedCard, setSelectedCard] = useState("Pre-saved card 1");

  // API state
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [apiError, setApiError] = useState<string | null>(null);

  // ACTIVE mode – zbývající sekundy podle reservation.end
  const [leftSec, setLeftSec] = useState(0);
  const [isGrace, setIsGrace] = useState(false);
  const [endingSoon, setEndingSoon] = useState(false);
  const [activeReservation, setActiveReservation] =
    useState<ReservationDetail | null>(null);
  const [isLoadingReservation, setIsLoadingReservation] = useState(true);

  // po načtení rezervace v ACTIVE režimu spočítej leftSec
  useEffect(() => {
    if (mode !== "active" || !reservationId) return;

    setIsLoadingReservation(true);
    const controller = new AbortController();

    (async () => {
      try {
        const res = await fetch(
          `/api/reservation/detail?id=${encodeURIComponent(reservationId)}`,
          { signal: controller.signal }
        );
        if (!res.ok) return;
        const data = (await res.json()) as ReservationDetail;

        setActiveReservation(data);
        const targetMs = data.phase === 'active'
          ? new Date(data.end).getTime()
          : data.graceEndsAt ? new Date(data.graceEndsAt).getTime() : new Date(data.end).getTime();
        const nowMs = Date.now();
        const secs = Math.max(0, Math.floor((targetMs - nowMs) / 1000));
        setLeftSec(secs);
        setIsGrace(data.phase === 'grace');
        setEndingSoon(!!data.endingSoon);
      } catch (e) {
        if ((e as Error).name !== 'AbortError') {
          console.error("Failed to load active reservation", e);
        }
      } finally {
        if (!controller.signal.aborted) {
          setIsLoadingReservation(false);
        }
      }
    })();

    return () => {
      controller.abort();
    };
  }, [mode, reservationId]);

  // Handler for creating reservation (Park Now)
  const handleParkNow = async () => {
    setIsSubmitting(true);
    setApiError(null);

    try {
      const now = new Date();
      const endTime = new Date(now.getTime() + minutes * 60 * 1000);

      const response = await fetch("/api/reservation/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          parkSlotId: params.spotId,
          start: now.toISOString(),
          end: endTime.toISOString(),
        }),
      });

      if (!response.ok) {
        const error = await response.json().catch(() => null);
        throw new Error(error?.error || "Failed to create reservation");
      }

      const data = await response.json();
      const newReservationId = data.reservation.id;

      router.push(
        `/parking-lots/${params.id}/reserve/${params.spotId}?mode=active&name=${encodeURIComponent(
          areaName
        )}&pricePerHour=${pricePerHour}&spotLabel=${encodeURIComponent(
          spotLabel
        )}&reservationId=${newReservationId}`
      );
    } catch (err) {
      setApiError(
        err instanceof Error
          ? err.message
          : "An error occurred while creating reservation"
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handler for canceling reservation
  const handleCancelReservation = async () => {
    if (!reservationId) {
      setApiError("No reservation ID found");
      return;
    }

    if (!confirm("Are you sure you want to cancel this reservation?")) {
      return;
    }

    setIsSubmitting(true);
    setApiError(null);

    try {
      const response = await fetch(`/api/reservation/${reservationId}`, {
        method: "PATCH",
      });

      if (!response.ok) {
        const error = await response.json().catch(() => null);
        throw new Error(error?.error || "Failed to cancel reservation");
      }

      router.push(`/parking-lots/${params.id}/reserve`);
    } catch (err) {
      setApiError(
        err instanceof Error ? err.message : "An error occurred while cancelling"
      );
    } finally {
      setIsSubmitting(false);
    }
  };


  useEffect(() => {
    if (mode !== "active") return;
    const t = setInterval(
      () => setLeftSec((s) => Math.max(0, s - 1)),
      1000
    );
    return () => clearInterval(t);
  }, [mode]);

  // free until text v active režimu podle reservation.end
  const freeUntilActive = useMemo(() => {
    if (!activeReservation) return freeUntilStatic;
    const end = isGrace && activeReservation.graceEndsAt
      ? new Date(activeReservation.graceEndsAt)
      : new Date(activeReservation.end);
    return end.toLocaleTimeString("cs-CZ", {
      hour: "2-digit",
      minute: "2-digit",
    });
  }, [activeReservation, freeUntilStatic, isGrace]);

  return (
    <main className="min-h-screen bg-white">
      <div className="max-w-xl mx-auto px-6 py-10">
        {/* Heading */}
        <h1 className="text-5xl leading-tight font-extrabold tracking-tight text-black mb-1">
          {mode === "park" && "Park"}
          {mode === "reserve" && "Reserve"}
          {mode === "active" && "Parking"}
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
        {mode === "park" && (
          <>
            <section className="bg-gray-100 rounded-2xl p-6 mb-6">
              <h2 className="text-2xl font-semibold text-black mb-4">
                Park now for:
              </h2>

              <div className="flex items-baseline gap-5 mb-4">
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    min={5}
                    step={5}
                    value={minutes}
                    onChange={(e) =>
                      setMinutes(
                        clamp(
                          parseInt(e.target.value || "0", 10),
                          5,
                          12 * 60
                        )
                      )
                    }
                    className="text-blue-600 text-5xl font-bold w-28 bg-transparent outline-none"
                  />
                  <span className="text-blue-600 text-3xl font-bold">min</span>
                </div>
                <div className="text-4xl text-gray-500 font-semibold">
                  {czk(priceNow)}
                </div>
              </div>

              <div className="text-green-600 font-medium mb-4">
                Free until {freeUntilStatic}
              </div>

              <button
                className="rounded-2xl px-6 py-3 bg-green-500 text-white font-medium hover:opacity-90"
                onClick={() =>
                  setMinutes((m) => clamp(m + 15, 5, 12 * 60))
                }
              >
                Add 15 min
              </button>
            </section>

            <section className="bg-gray-100 rounded-2xl p-6">
              <h3 className="text-xl font-semibold text-black mb-4">
                Choose payment method
              </h3>

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
                {isSubmitting ? "Processing..." : "Pay & Park"}
              </button>
            </div>
          </>
        )}

        {/* RESERVE FOR LATER */}
        {mode === "reserve" && (
          <>
            {/* RESERVE*/}
          </>
        )}

        {/* PARKING IN PROGRESS */}
        {mode === "active" && (
          <>
            <section className="bg-gray-100 rounded-2xl p-6">
              <h2 className="text-2xl font-semibold text-black mb-4">
                Parking in progress:
              </h2>

              {isLoadingReservation ? (
                <div className="flex items-center h-[60px] mb-2">
                  <svg
                    className="animate-spin h-10 w-10 text-blue-600"
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                  >
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                    ></circle>
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                    ></path>
                  </svg>
                </div>
              ) : (
                <>
                  {endingSoon && !isGrace && (
                    <div className="text-red-600 font-semibold text-sm mb-1">
                      Ending in under 5 minutes
                    </div>
                  )}
                  {isGrace && (
                    <div className="text-orange-600 font-semibold text-sm mb-1">
                      Grace period
                    </div>
                  )}
                  <div className={`${isGrace ? 'text-orange-600' : 'text-blue-600'} text-5xl font-bold mb-2`}>
                    {Math.floor(leftSec / 60)} min{" "}
                    {String(leftSec % 60).padStart(2, "0")} left
                  </div>
                </>
              )}
              <div className={`${isGrace ? 'text-orange-600' : 'text-green-600'} font-medium mb-6`}>
                {isGrace ? 'Grace until' : 'Free until'} {freeUntilActive}
              </div>

              <div className="flex gap-4">
                <button
                  className="rounded-2xl px-6 py-3 border border-red-300 text-red-600 bg-red-50 hover:bg-red-100 font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                  onClick={handleCancelReservation}
                  disabled={isSubmitting}
                >
                  {isSubmitting ? "Cancelling..." : "Cancel"}
                </button>

                <button
                  className="rounded-2xl px-6 py-3 bg-green-500 text-white font-medium hover:opacity-90"
                  onClick={() => {
                    if (!reservationId) {
                      setApiError("No reservation ID found");
                      return;
                    }
                    router.push(`/reservations/${reservationId}/prolong`);
                  }}
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
