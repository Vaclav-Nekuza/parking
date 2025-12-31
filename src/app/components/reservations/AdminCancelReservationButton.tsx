"use client";

import { useState } from "react";

type AdminCancelReservationButtonProps = {
    reservationId: string; // ID rezervace z DB
    initialCancelled?: boolean; // true, pokud už je zrušená (cancelledAt != null)
};

export default function AdminCancelReservationButton({
                                                         reservationId,
                                                         initialCancelled = false,
                                                     }: AdminCancelReservationButtonProps) {
    const [isCancelling, setIsCancelling] = useState(false);
    const [isCancelled, setIsCancelled] = useState(initialCancelled);
    const [error, setError] = useState<string | null>(null);

    const handleCancel = async () => {
        if (isCancelling || isCancelled) return;

        const confirmed = window.confirm("Opravdu chceš zrušit tuto rezervaci?");
        if (!confirmed) return;

        try {
            setIsCancelling(true);
            setError(null);

            // IMPORTANT: admin cancel endpoint
            const res = await fetch(
                `/api/reservation/delete-by-admin/${reservationId}`,
                {
                    method: "PATCH",
                }
            );

            if (!res.ok) {
                let message = "Nepodařilo se zrušit rezervaci.";
                try {
                    const body = await res.json();
                    if (body?.error) message = body.error;
                } catch {
                    // ignore
                }
                throw new Error(message);
            }

            setIsCancelled(true);

            // refresh to re-fetch slots / UI
            window.location.reload();
        } catch (e: unknown) {
            if (e instanceof Error) {
                setError(e.message || "Došlo k chybě při rušení rezervace.");
            } else {
                setError("Došlo k chybě při rušení rezervace.");
            }
        } finally {
            setIsCancelling(false);
        }
    };

    if (isCancelled) {
        return <span className="text-xs text-gray-500">Rezervace zrušena</span>;
    }

    return (
        <div className="flex flex-col gap-1">
            <button
                type="button"
                onClick={handleCancel}
                disabled={isCancelling}
                className={`px-3 py-1 rounded text-xs border ${
                    isCancelling
                        ? "opacity-60 cursor-not-allowed"
                        : "hover:bg-red-50 hover:border-red-500"
                }`}
            >
                {isCancelling ? "Ruším..." : "Zrušit rezervaci"}
            </button>

            {error && <span className="text-[11px] text-red-600">{error}</span>}
        </div>
    );
}
