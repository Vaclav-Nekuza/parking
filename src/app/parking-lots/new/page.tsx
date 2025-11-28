"use client";

import { useState, FormEvent, ChangeEvent } from "react";
import { withAuth } from "../../components/auth/withAuth";
import { useSession } from "../../contexts/session-context";
import { useRouter } from "next/navigation";

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

function CreateParkingLotPageComponent() {
  const { logout } = useSession();
  const router = useRouter();
  const [step, setStep] = useState<1 | 2>(1);

  const [values, setValues] = useState<Values>({
    address: "",
    capacity: "",
    pricePerHour: "",
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
  ): (e: ChangeEvent<HTMLInputElement>) => void {
    return (e) => set(key, e.target.value as Values[typeof key]);
  }

  function validate(v: Values): Errors {
    const err: Errors = {};
    if (!v.address.trim()) err.address = "Please enter an address.";
    if (!v.capacity) err.capacity = "Please enter the capacity.";
    if (!v.pricePerHour) err.pricePerHour = "Please enter the price per hour.";
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
      address: values.address,
      capacity: Number(values.capacity),
      pricePerHour: Number(values.pricePerHour),
    };

    try {
      const res = await fetch("/api/parking-lots", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      let data: unknown = null;
      try {
        data = await res.json();
      } catch {
        data = null;
      }

      if (!res.ok) {
        const errorMsg =
          data &&
          typeof data === "object" &&
          "error" in data &&
          typeof (data as { error: unknown }).error === "string"
            ? (data as { error: string }).error
            : `Failed to create the parking lot. (status ${res.status}).`;
        setServerError(errorMsg);
        return;
      }

      // Success -> optional message, then redirect to admin home
      setServerSuccess("The parking lot was successfully created.");
      router.push("/home/admin");
      return;
    } catch (error) {
      console.error("POST /api/parking-lots failed:", error);
      setServerError("Error communicating with the server.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <main className="min-h-screen bg-white">
      <div className="max-w-xl mx-auto px-6 py-10">
        <div className="flex justify-between items-start mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">
              Create a new parking lot
            </h1>
            <p className="mt-2 text-gray-600">
              Fill in the details below to add a new parking lot to the system.
            </p>
          </div>
          <button
            onClick={() => logout()}
            className="rounded-2xl px-6 py-2 bg-red-500 text-white font-medium hover:opacity-90 transition-opacity"
          >
            Logout
          </button>
        </div>

        {step === 1 && (
          <section className="mt-10 space-y-8">
            <form onSubmit={handleContinue} className="space-y-6">
              {/* Address */}
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Address
                </label>
                <input
                  type="text"
                  className="mt-2 block w-full rounded-2xl border border-gray-300 px-4 py-3 text-gray-900 shadow-sm focus:border-black focus:ring-black"
                  placeholder="E.g., Prague 1, Wenceslas Square 1"
                  value={values.address}
                  onChange={onInputChange("address")}
                />
                {errors.address && (
                  <p className="mt-1 text-sm text-red-600">
                    {errors.address}
                  </p>
                )}
              </div>

              {/* Capacity */}
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Capacity
                </label>
                <input
                  type="number"
                  className="mt-2 block w-full rounded-2xl border border-gray-300 px-4 py-3 text-gray-900 shadow-sm focus:border-black focus:ring-black"
                  placeholder="Maximum vehicle capacity"
                  value={values.capacity}
                  onChange={onInputChange("capacity")}
                />
                {errors.capacity && (
                  <p className="mt-1 text-sm text-red-600">
                    {errors.capacity}
                  </p>
                )}
              </div>

              {/* Price per hour */}
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Price per hour (CZK)
                </label>
                <input
                  type="number"
                  className="mt-2 block w-full rounded-2xl border border-gray-300 px-4 py-3 text-gray-900 shadow-sm focus:border-black focus:ring-black"
                  placeholder="E.g., 50"
                  value={values.pricePerHour}
                  onChange={onInputChange("pricePerHour")}
                />
                {errors.pricePerHour && (
                  <p className="mt-1 text-sm text-red-600">
                    {errors.pricePerHour}
                  </p>
                )}
              </div>

              {/* Continue + Not now */}
              <div className="pt-4 flex items-center justify-between">
                <button
                  type="submit"
                  className="inline-flex items-center rounded-2xl bg-black px-6 py-3 text-sm font-semibold text-white shadow-sm hover:bg-gray-900 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-black"
                >
                  Continue
                </button>

                <button
                  type="button"
                  className="inline-flex items-center rounded-2xl border border-gray-300 px-6 py-3 text-sm font-semibold text-gray-700 hover:bg-gray-50"
                  onClick={() => router.push("/home/admin")}
                >
                  Not now
                </button>
              </div>
            </form>
          </section>
        )}

        {step === 2 && (
          <section className="mt-10 space-y-8">
            {/* Recap */}
            <div className="space-y-4 rounded-2xl border border-gray-200 bg-gray-50 px-6 py-5">
              <h2 className="text-lg font-semibold text-gray-900">
                Confirm Details
              </h2>
              <p className="text-sm text-gray-600">
                Please review the information before saving the parking lot.
              </p>

              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-500">Address:</span>
                  <div className="bg-white border rounded-2xl px-4 py-3 text-lg font-semibold text-black">
                    {values.address || "—"}
                  </div>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-500">Capacity:</span>
                  <div className="bg-white border rounded-2xl px-4 py-3 text-lg font-semibold text-black">
                    {values.capacity || "—"}
                  </div>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-500">Price per hour:</span>
                  <div className="bg-white border rounded-2xl px-4 py-3 text-lg font-semibold text-black">
                    {values.pricePerHour ? `${values.pricePerHour} CZK` : "—"}
                  </div>
                </div>
              </div>
            </div>

            {serverError && (
              <p className="mt-4 text-sm text-red-600">{serverError}</p>
            )}
            {serverSuccess && (
              <p className="mt-2 text-sm text-green-600">
                {serverSuccess}
              </p>
            )}

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

export default withAuth(CreateParkingLotPageComponent, { requiredRole: "admin" });