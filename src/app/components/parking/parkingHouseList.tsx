"use client";

import styles from "./parkingHouseList.module.css";

export type ParkingHouse = {
  id: string;
  adminId: string;
  address: string;
  price: number;
  createdAt: string;
};

type Props = {
  parkingHouses: ParkingHouse[];
  loading: boolean;
  error: string | null;
  /** e.g. "Book now" for drivers, "Edit" for admin */
  primaryActionLabel: string;
  /** optional click handler for the main button */
  onPrimaryActionClick?: (house: ParkingHouse) => void;
};

export function ParkingHouseList({
  parkingHouses,
  loading,
  error,
  primaryActionLabel,
  onPrimaryActionClick,
}: Props) {
  function formatDate(dateString: string): string {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  }

  if (loading) {
    return (
      <div className={styles.loadingWrapper}>
        <div className={styles.loadingText}>Loading parking houses...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={styles.errorBox}>
        <p className={styles.errorText}>Error: {error}</p>
      </div>
    );
  }

  if (!parkingHouses.length) {
    return (
      <div className={styles.emptyState}>
        <div className={styles.emptyTitle}>No parking houses available</div>
        <p className={styles.emptyText}>
          Check back later for new parking opportunities.
        </p>
      </div>
    );
  }

  return (
    <div className={styles.listWrapper}>
      {parkingHouses.map((house) => (
        <div key={house.id} className={styles.card}>
          <div className={styles.cardGrid}>
            <div className={styles.leftColumn}>
              <div className={styles.label}>Address</div>
              <div className={styles.address}>{house.address}</div>
              <div className={styles.meta}>
                Added: {formatDate(house.createdAt)}
              </div>
            </div>

            <div className={styles.rightColumn}>
              <div className={styles.label}>Price per hour</div>
              <div className={styles.price}>{house.price} CZK</div>
              <button
                className={styles.primaryButton}
                type="button"
                onClick={
                  onPrimaryActionClick
                    ? () => onPrimaryActionClick(house)
                    : undefined
                }
              >
                {primaryActionLabel}
              </button>
            </div>
          </div>

          <div className={styles.footer}>
            <div className={styles.footerText}>Admin ID: {house.adminId}</div>
          </div>
        </div>
      ))}
    </div>
  );
}