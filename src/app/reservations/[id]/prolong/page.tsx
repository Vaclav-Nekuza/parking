"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import { ReservationForm } from "../../../components/parking/ReservationForm";

type ReservationDetail = {
  id: string;
  start: string;
  end: string;
  parkingSlot: {
    id: string;
    parkingHouse: {
      id: string;
      address: string;
      price: number;
    };
  };
};


export default function ProlongReservationPage() {
  const router = useRouter();
  const params = useParams<{ id: string }>();
  const searchParams = useSearchParams();
  const returnUrl = searchParams.get("returnUrl");

  const reservationId = params.id;

  const [reservation, setReservation] = useState<ReservationDetail | null>(
    null
  );
  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!reservationId) return;

    const fetchReservation = async () => {
      try {
        setLoading(true);
        const res = await fetch(
          `/api/reservation/detail?id=${encodeURIComponent(reservationId)}`
        );
        if (!res.ok) {
          throw new Error("Failed to load reservation");
        }
        const data = (await res.json()) as ReservationDetail;
        setReservation(data);
      } catch (err) {
        console.error(err);
        setError("Failed to load reservation.");
      } finally {
        setLoading(false);
      }
    };

    fetchReservation();
  }, [reservationId]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-gray-500 text-lg">Loading reservation…</p>
      </div>
    );
  }

  if (error || !reservation) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-4">
        <p className="text-red-600">
          {error ?? "Reservation not found."}
        </p>
        <button
          onClick={() => router.back()}
          className="px-4 py-2 rounded-xl border border-gray-300 bg-white text-gray-700"
        >
          Back
        </button>
      </div>
    );
  }

  const pricePerHour = reservation.parkingSlot.parkingHouse.price;

  const currentEnd = new Date(reservation.end);
  const freeUntilLabel = currentEnd.toLocaleTimeString("cs-CZ", {
    hour: "2-digit",
    minute: "2-digit",
  });

  const handleBack = () => {
    if (returnUrl) {
      router.push(returnUrl);
    } else {
      router.back();
    }
  };

  const handleSubmit = async (minutes: number, _paymentMethod: string) => {
    try {
      setIsSubmitting(true);
      const res = await fetch("/api/reservation/prolong", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          reservationId,
          minutes,
        }),
      });

      if (!res.ok) {
        throw new Error("Failed to prolong reservation");
      }

      await res.json();

      if (returnUrl) {
        router.push(returnUrl);
      } else {
        router.back();
      }
    } catch (err) {
      console.error(err);
      alert("Failed to prolong reservation");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen flex justify-center px-4 py-10 bg-white text-black">
      <div className="max-w-2xl w-full">
        <h1 className="text-4xl font-bold mb-2">
          Prolong spot {reservation.parkingSlot.parkingHouse.address}
        </h1>
        <p className="text-gray-500 mb-8">
          {reservation.parkingSlot.parkingHouse.address} • {pricePerHour} CZK/hour
        </p>

        <ReservationForm
          mode="prolong"
          pricePerHour={pricePerHour}
          onSubmit={handleSubmit}
          isSubmitting={isSubmitting}
          onBack={handleBack}
          freeUntil={`current end: ${freeUntilLabel}`}
        />
      </div>
    </div>
  );
}
