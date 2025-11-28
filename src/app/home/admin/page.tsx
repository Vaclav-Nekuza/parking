"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

import { withAuth } from "../../components/auth/withAuth";
import { useSession } from "../../contexts/session-context";
import {
  ParkingHouse,
  ParkingHouseList,
} from "../../components/parking/parkingHouseList";

import styles from "./admin-home.module.css";

function AdminHomePageComponent() {
  const { logout, user } = useSession();
  const router = useRouter();

  const [parkingHouses, setParkingHouses] = useState<ParkingHouse[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // src/app/home/admin/page.tsx (snippet)

  useEffect(() => {
    async function fetchParkingHouses() {
      try {
        setLoading(true);
        setError(null);

        // ⬇️ use the scoped version for admin
        const response = await fetch("/api/parkinglots?scope=mine");
        if (!response.ok) {
          throw new Error("Failed to fetch parking houses");
        }

        const data: ParkingHouse[] = await response.json();
        setParkingHouses(data);
      } catch (err) {
        setError(
          err instanceof Error
            ? err.message
            : "An error occurred while loading parking houses."
        );
      } finally {
        setLoading(false);
      }
    }

    fetchParkingHouses();
  }, []);

  const displayName = user?.name?.trim()?.split(" ")[0] || "Admin";

  return (
    <main className={styles.main}>
      <div className={styles.container}>
        {/* Header */}
        <div className={styles.header}>
          <div>
            <h1 className={styles.title}>Welcome, {displayName}</h1>
            <p className={styles.userId}>ID: {user?.id ?? "—"}</p>
            <p className={styles.subtitle}>
              This is your parking owner dashboard. From here you’ll be able to
              manage your parking lots and reservations.
            </p>
          </div>

          <button onClick={logout} className={styles.logoutButton}>
            Logout
          </button>
        </div>

        {/* Content */}
        <section className={styles.section}>
          {/* Add button + heading */}
          <div>
            <button
              type="button"
              onClick={() => router.push("/parking-lots/new")}
              className={styles.addButton}
            >
              Add parking lot
            </button>

            <h2 className={styles.sectionTitle}>My parking lots</h2>
          </div>

          {/* List of parking houses */}
          <ParkingHouseList
            parkingHouses={parkingHouses}
            loading={loading}
            error={error}
            primaryActionLabel="Edit"
            onPrimaryActionClick={(house) =>
              router.push(
                `/parking-lots/edit?id=${encodeURIComponent(house.id)}`
              )
            }
          />
        </section>
      </div>
    </main>
  );
}

export default withAuth(AdminHomePageComponent, { requiredRole: "admin" });