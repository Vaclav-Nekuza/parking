export const config = {
        databaseUrl: process.env.DATABASE_URL as string,
};

// Reservation timing configuration with safe defaults
export const RESERVATION_GRACE_MINUTES = Number(
    process.env.RESERVATION_GRACE_MINUTES ?? 3
);
export const RESERVATION_ENDING_SOON_MINUTES = Number(
    process.env.RESERVATION_ENDING_SOON_MINUTES ?? 5
);

if (!config.databaseUrl) {
        throw new Error("DATABASE_URL is not defined in environment variables");
}
