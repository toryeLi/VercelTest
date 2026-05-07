import { neon } from "@neondatabase/serverless";

function getDatabaseUrl() {
  return (
    process.env.POSTGRES_URL ||
    process.env.DATABASE_URL ||
    process.env.POSTGRES_PRISMA_URL ||
    ""
  );
}

function getSql() {
  const databaseUrl = getDatabaseUrl();

  if (!databaseUrl) {
    throw new Error(
      "缺少数据库连接字符串，请配置 POSTGRES_URL 或 DATABASE_URL 环境变量。"
    );
  }

  return neon(databaseUrl);
}

async function ensureUsersTable() {
  const sql = getSql();

  await sql`
    CREATE TABLE IF NOT EXISTS users (
      id SERIAL PRIMARY KEY,
      name TEXT NOT NULL,
      email TEXT NOT NULL UNIQUE,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `;
}

export { ensureUsersTable, getSql };
