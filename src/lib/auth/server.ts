import { betterAuth } from "better-auth";
import { prismaAdapter } from "better-auth/adapters/prisma";
import { prisma } from "../db";

export const auth = betterAuth({
    emailAndPassword: {
        enabled: false,
    },
    database: prismaAdapter(prisma, {
        provider: "postgresql",
    }),
    socialProviders: {
        roblox: {
            clientId: process.env["ROBLOX_CLIENT_ID"] as string,
            clientSecret: process.env["ROBLOX_CLIENT_SECRET"] as string,
        }
    }
});