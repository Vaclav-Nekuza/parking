"use client";

import { useState, FormEvent, ChangeEvent } from "react";

type Values = {
    address: string;
    capacity: string;
    pricePerHour: string;
};

type Errors = Partial<{
    address: string;
    capacity: string;
    pricePerHour: string;
}>;

export default function CreateParkingLotPage() {
    const [step, setStep] = useState<1 | 2>(1);

    const [values, setValues] = useState<Values>({
        address: "",
        capacity: "",
        pricePerHour: "",
    });

    const [errors, setErrors] = useState<Errors>({});

    function set<K extends keyof Values>(key: K, value: Values[K]) {
        setValues((prev) => ({ ...prev, [key]: value }));
    }

    function onInputChange(
        key: keyof Values
    ): (e: ChangeEvent<HTMLInputElement>) => void {
        return (e) => set(key, e.target.value as Values[typeof key]);
    }

    function validate(v: Values): Errors {
        const err: Errors = {};
        if (!v.address) err.address = "Zadej adresu.";
        if (!v.capacity) err.capacity = "Zadej počet míst.";
        if (!v.pricePerHour) err.pricePerHour = "Zadej cenu za hodinu.";
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

    function handleSave() {
        // finální payload (převod čísel ze stringu)
        const payload = {
            address: values.address,
            capacity: Number(values.capacity),
            pricePerHour: Number(values.pricePerHour),
        };
        console.log("SAVE (mock):", payload);
        alert("Uloženo (mock). Až bude backend, napojíme POST.");
    }

    return (
        <main className="min-h-screen bg-white">
            <div className="max-w-xl mx-auto px-6 py-10">
                {/* Hlavní nadpis + podnadpis (stejný styl, jen pro desktop centrovaný blok) */}
                <h1 className="text-5xl leading-tight font-extrabold tracking-tight text-black mb-1">
                    Add
                    <br />
                    parking area
                </h1>
                <p className="text-gray-500 mb-8">
                    Add new parking area that you own
                </p>

                {step === 1 && (
                    <form onSubmit={handleContinue} className="space-y-6">
                        {/* Address */}
                        <div>
                            <label className="block text-base font-medium mb-2">Address</label>
                            <input
                                className="w-full bg-gray-100 rounded-2xl px-4 py-3 outline-none"
                                placeholder=""
                                value={values.address}
                                onChange={onInputChange("address")}
                            />
                            {errors.address && (
                                <p className="text-red-600 text-sm mt-1">{errors.address}</p>
                            )}
                        </div>

                        {/* Number of parking spots */}
                        <div>
                            <label className="block text-base font-medium mb-2">
                                Number of parking spots
                            </label>
                            <input
                                type="number"
                                className="w-full bg-gray-100 rounded-2xl px-4 py-3 outline-none"
                                placeholder="1"
                                value={values.capacity}
                                onChange={onInputChange("capacity")}
                                min={0}
                            />
                            {errors.capacity && (
                                <p className="text-red-600 text-sm mt-1">{errors.capacity}</p>
                            )}
                        </div>

                        {/* Price per hour */}
                        <div>
                            <label className="block text-base font-medium mb-2">
                                Price per hour
                            </label>
                            <input
                                type="number"
                                className="w-full bg-gray-100 rounded-2xl px-4 py-3 outline-none"
                                placeholder="kč"
                                value={values.pricePerHour}
                                onChange={onInputChange("pricePerHour")}
                                min={0}
                            />
                            {errors.pricePerHour && (
                                <p className="text-red-600 text-sm mt-1">
                                    {errors.pricePerHour}
                                </p>
                            )}
                        </div>

                        {/* Continue button vpravo dole */}
                        <div className="flex justify-end pt-2">
                            <button
                                type="submit"
                                className="rounded-2xl px-8 py-3 bg-blue-400 text-white font-medium hover:opacity-90"
                            >
                                Continue
                            </button>
                        </div>
                    </form>
                )}

                {step === 2 && (
                    <section className="mt-4">
                        <h2 className="text-3xl font-extrabold text-gray-400 mb-4">
                            Is this information correct?
                        </h2>

                        <div className="space-y-5">
                            {/* Address summary */}
                            <div>
                                <div className="text-sm font-medium text-gray-700 mb-1">
                                    Address
                                </div>
                                <div className="bg-white border rounded-2xl px-4 py-3 text-lg font-semibold">
                                    {values.address || "—"}
                                </div>
                            </div>

                            {/* Two-column summary: No. of spots / Price per hour */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <div className="text-sm font-medium text-gray-700 mb-1">
                                        No. of spots
                                    </div>
                                    <div className="bg-white border rounded-2xl px-4 py-3 text-lg font-semibold">
                                        {values.capacity || "—"}
                                    </div>
                                </div>
                                <div>
                                    <div className="text-sm font-medium text-gray-700 mb-1">
                                        Price per hour
                                    </div>
                                    <div className="bg-white border rounded-2xl px-4 py-3 text-lg font-semibold">
                                        {values.pricePerHour ? `${values.pricePerHour} CZK` : "—"}
                                    </div>
                                </div>
                            </div>
                        </div>

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
                            >
                                Yes, Save
                            </button>
                        </div>
                    </section>
                )}
            </div>
        </main>
    );
}
