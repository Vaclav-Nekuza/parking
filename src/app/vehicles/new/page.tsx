"use client";

import { useState, FormEvent, ChangeEvent } from "react";

type Values = {
    spz: string;
    type: string;
    driverId: string;
};

type Errors = Partial<{
    spz: string;
    type: string;
    driverId: string;
}>;

export default function RegisterVehiclePage() {
    const [step, setStep] = useState<1 | 2>(1);

    const [values, setValues] = useState<Values>({
        spz: "",
        type: "",
        driverId: "",
    });

    const [errors, setErrors] = useState<Errors>({});

    const [saving, setSaving] = useState(false);
    const [serverError, setServerError] = useState<string | null>(null);
    const [serverSuccess, setServerSuccess] = useState<string | null>(null);

    function set<K extends keyof Values>(key: K, value: Values[K]) {
        setValues((prev) => ({ ...prev, [key]: value }));
    }

    function onInputChange(
        key: keyof Values
    ): (e: ChangeEvent<HTMLInputElement | HTMLSelectElement>) => void {
        return (e) => set(key, e.target.value as Values[typeof key]);
    }

    function validate(v: Values): Errors {
        const err: Errors = {};
        if (!v.spz.trim()) err.spz = "Zadej SPZ vozidla.";
        if (!v.type.trim()) err.type = "Vyber typ vozidla.";
        if (!v.driverId.trim()) err.driverId = "Zadej driverId (ID řidiče).";
        return err;
    }

    function handleContinue(e: FormEvent<HTMLFormElement>) {
        e.preventDefault();
        const err = validate(values);
        setErrors(err);
        if (Object.keys(err).length === 0) {
            setStep(2);
        }
    }


    async function handleSave() {
        setSaving(true);
        setServerError(null);
        setServerSuccess(null);

        const payload = {
            spzReq: values.spz,
            driverIdReq: values.driverId,
            typeReq: values.type,
        };

        try {
            const res = await fetch("/api/vehicle-registration", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify(payload),
            });

            type VehicleResponse = {
                id: string;
                SPZ: string;
                type: string;
                driverId: string;
                createdAt: string;
            };

            type ErrorResponse = { error: string };

            let data: VehicleResponse | ErrorResponse | null = null;
            try {
                data = await res.json();
            } catch {
                data = null;
            }

            if (!res.ok) {
                const message =
                    data && "error" in data && typeof (data as any).error === "string"
                        ? (data as any).error
                        : `Nepodařilo se zaregistrovat vozidlo (status ${res.status}).`;
                setServerError(message);
                return;
            }

            console.log("Vehicle registered:", data);
            setServerSuccess("Vozidlo bylo úspěšně zaregistrováno.");

            // reset formuláře + návrat na krok 1
            setValues({
                spz: "",
                type: "",
                driverId: "",
            });
            setStep(1);
        } catch (error) {
            console.error("POST /api/vehicle-registration failed:", error);
            setServerError("Chyba při komunikaci se serverem.");
        } finally {
            setSaving(false);
        }
    }

    return (
        <main className="min-h-screen bg-white">
            <div className="max-w-xl mx-auto px-6 py-10">
                <h1 className="text-3xl font-bold text-gray-900">
                    Register a new vehicle
                </h1>
                <p className="mt-2 text-gray-600">
                    Fill in the details below to register a vehicle in the system.
                </p>

                {step === 1 && (
                    <section className="mt-10 space-y-8">
                        <form onSubmit={handleContinue} className="space-y-6">
                            {/* SPZ */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700">
                                    SPZ
                                </label>
                                <input
                                    type="text"
                                    className="mt-2 block w-full rounded-2xl border border-gray-300 px-4 py-3 text-gray-900 shadow-sm focus:border-black focus:ring-black"
                                    placeholder="Např. 1AB 2345"
                                    value={values.spz}
                                    onChange={onInputChange("spz")}
                                />
                                {errors.spz && (
                                    <p className="mt-1 text-sm text-red-600">{errors.spz}</p>
                                )}
                            </div>

                            {/* Typ vozidla – dropdown */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700">
                                    Vehicle type
                                </label>
                                <select
                                    className="mt-2 block w-full rounded-2xl border border-gray-300 px-4 py-3 text-gray-900 shadow-sm focus:border-black focus:ring-black bg-white"
                                    value={values.type}
                                    onChange={onInputChange("type")}
                                >
                                    <option value="">Vyber typ vozidla</option>
                                    <option value="car">Osobní auto</option>
                                    <option value="van">Dodávka</option>
                                    <option value="truck">Nákladní</option>
                                    <option value="bus">Autobus</option>
                                    <option value="motorcycle">Motocykl</option>
                                </select>
                                {errors.type && (
                                    <p className="mt-1 text-sm text-red-600">{errors.type}</p>
                                )}
                            </div>

                            {/* Driver ID */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700">
                                    Driver ID
                                </label>
                                <input
                                    type="text"
                                    className="mt-2 block w-full rounded-2xl border border-gray-300 px-4 py-3 text-gray-900 shadow-sm focus:border-black focus:ring-black"
                                    placeholder="Zadej ID řidiče z databáze"
                                    value={values.driverId}
                                    onChange={onInputChange("driverId")}
                                />
                                {errors.driverId && (
                                    <p className="mt-1 text-sm text-red-600">{errors.driverId}</p>
                                )}
                            </div>

                            {/* Continue */}
                            <div className="pt-4">
                                <button
                                    type="submit"
                                    className="inline-flex items-center rounded-2xl bg-black px-6 py-3 text-sm font-semibold text-white shadow-sm hover:bg-gray-900 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-black"
                                >
                                    Continue
                                </button>
                            </div>
                        </form>
                    </section>
                )}

                {step === 2 && (
                    <section className="mt-10 space-y-8">
                        {/* Rekapitulace */}
                        <div className="space-y-4 rounded-2xl border border-gray-200 bg-gray-50 px-6 py-5">
                            <h2 className="text-lg font-semibold text-gray-900">
                                Confirm vehicle details
                            </h2>
                            <p className="text-sm text-gray-600">
                                Please review the information before saving the vehicle.
                            </p>

                            <div className="space-y-4">
                                <div className="flex items-center justify-between">
                                    <span className="text-sm text-gray-500">SPZ:</span>
                                    <div className="bg-white border rounded-2xl px-4 py-3 text-lg font-semibold text-black">
                                        {values.spz || "—"}
                                    </div>
                                </div>

                                <div className="flex items-center justify-between">
                                    <span className="text-sm text-gray-500">Vehicle type:</span>
                                    <div className="bg-white border rounded-2xl px-4 py-3 text-lg font-semibold text-black">
                                        {values.type || "—"}
                                    </div>
                                </div>

                                <div className="flex items-center justify-between">
                                    <span className="text-sm text-gray-500">Driver ID:</span>
                                    <div className="bg-white border rounded-2xl px-4 py-3 text-lg font-semibold text-black">
                                        {values.driverId || "—"}
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Zprávy z backendu */}
                        {serverError && (
                            <p className="mt-4 text-sm text-red-600">{serverError}</p>
                        )}
                        {serverSuccess && (
                            <p className="mt-2 text-sm text-green-600">
                                {serverSuccess}
                            </p>
                        )}

                        {/* Actions */}
                        <div className="flex items-center gap-4 mt-8">
                            <button
                                type="button"
                                className="rounded-2xl px-6 py-3 border border-red-300 text-red-600 bg-red-50 hover:bg-red-100"
                                onClick={() => setStep(1)}
                            >
                                No, Go Back
                            </button>
                            <button
                                type="button"
                                className="rounded-2xl px-6 py-3 border border-green-300 text-green-700 bg-green-50 hover:bg-green-100"
                                onClick={handleSave}
                                disabled={saving}
                            >
                                {saving ? "Saving..." : "Yes, Save"}
                            </button>
                        </div>
                    </section>
                )}
            </div>
        </main>
    );
}
