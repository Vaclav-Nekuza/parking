export const config = {
    databaseUrl: process.env.DATABASE_URL as string,
};

if (!config.databaseUrl) {
    throw new Error("DATABASE_URL is not defined in environment variables");
}
