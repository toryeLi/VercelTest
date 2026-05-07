import { PrismaClient } from "@prisma/client";
import { withAccelerate } from "@prisma/extension-accelerate";
import { loadLocalEnv } from "./env.js";

loadLocalEnv();

function getDatabaseUrl() {
  return process.env.DATABASE_URL || process.env.POSTGRES_URL || "";
}

if (!getDatabaseUrl()) {
  throw new Error("缺少数据库连接字符串，请配置 DATABASE_URL 环境变量。");
}

const globalForPrisma = globalThis;

const prisma =
  globalForPrisma.__prismaClient ||
  new PrismaClient().$extends(withAccelerate());

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.__prismaClient = prisma;
}

async function ensureUsersTable() {
  await prisma.$executeRawUnsafe(`
    CREATE TABLE IF NOT EXISTS users (
      id SERIAL PRIMARY KEY,
      name TEXT NOT NULL,
      email TEXT NOT NULL UNIQUE,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `);
}

export { ensureUsersTable, prisma };
