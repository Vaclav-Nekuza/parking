"use client";

import { useState, useMemo } from "react";

function czk(v: number) {
  return new Intl.NumberFormat("cs-CZ", {
    style: "currency",
    currency: "CZK",
    maximumFractionDigits: 0,
  }).format(v);
}

const clamp = (n: number, min: number, max: number) =>
  Math.max(min, Math.min(max, n));

interface ReservationFormProps {
  mode: "create" | "prolong";
  pricePerHour: number;
  spotLabel?: string;
  areaName?: string;
  onSubmit: (minutes: number, paymentMethod: string) => Promise<void>;
  isSubmitting: boolean;
  onBack: () => void;
  freeUntil?: string;
}

export function ReservationForm({
  mode,
  pricePerHour,
  spotLabel,
  areaName,
  onSubmit,
  isSubmitting,
  onBack,
  freeUntil = "14:00",
}: ReservationFormProps) {
  const [minutes, setMinutes] = useState(15);
  const [selectedCard, setSelectedCard] = useState("Pre-saved card 1");

  const priceNow = useMemo(
    () => Math.ceil((minutes / 60) * pricePerHour),
    [minutes, pricePerHour]
  );

  const handleSubmit = async () => {
    await onSubmit(minutes, selectedCard);
  };

  return (
    <>
      <section className="bg-gray-100 rounded-2xl p-6 mb-6">
        <h2 className="text-2xl font-semibold text-black mb-4">
          {mode === "create" ? "Park now for:" : "Prolong parking for:"}
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
                  clamp(parseInt(e.target.value || "0", 10), 5, 12 * 60)
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
          Free until {freeUntil}
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
        <button
          onClick={onBack}
          className="rounded-2xl px-8 py-3 border border-gray-300 text-gray-700 font-medium hover:opacity-90"
        >
          Back
        </button>
        <button
          className="rounded-2xl px-8 py-3 bg-blue-400 text-white font-medium hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed"
          onClick={handleSubmit}
          disabled={isSubmitting}
        >
          {isSubmitting
            ? "Processing..."
            : mode === "create"
            ? "Pay & Park"
            : "Pay & Prolong"}
        </button>
      </div>
    </>
  );
}
