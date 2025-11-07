import Link from "next/link";

export default function Home() {
  return (
    <main className="p-8">
      <h1 className="text-3xl font-bold mb-4">Parking – demo</h1>
      <Link
        href="/parking-lots/1/reserve?name=Parking%20area%201&pricePerHour=40"
        className="inline-block rounded-full px-4 py-2 border border-blue-200 bg-blue-50 text-blue-600 font-semibold"
      >
        Open “Parking area 1”
      </Link>
    </main>
  );
}
