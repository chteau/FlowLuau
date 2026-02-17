import { PrismaClient } from "@/generated/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { Pool } from "pg";

const global = globalThis as unknown as {
    prisma: PrismaClient | undefined;
}

const pool = new Pool({
    connectionString: process.env["DATABASE_URL_CLIENT"]! as string,
});

const adapter = new PrismaPg(pool);
export const prisma = global.prisma ?? new PrismaClient({
    adapter,
    log: ["query", "info", "warn", "error"],
});

if (process.env.NODE_ENV !== "production") global.prisma = prisma;