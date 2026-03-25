import { Enviroments } from "../constants/enums";
import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { Pool } from "pg";

const globalForPrisma = global as unknown as { prisma: PrismaClient };

const connectionString = process.env.DATABASE_URL;
const pool = new Pool({ connectionString });
const adapter = new PrismaPg(pool);

export const db =
  globalForPrisma.prisma ??
  new PrismaClient({
    log:
      process.env.NODE_ENV === Enviroments.DEV
        ? ["query", "error", "warn"]
        : ["error"],
    adapter: adapter,
  });

if (process.env.NODE_ENV !== Enviroments.PROD) globalForPrisma.prisma = db;
