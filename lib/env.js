import fs from "node:fs";
import path from "node:path";

function parseEnvValue(value) {
  const trimmed = value.trim();

  if (
    (trimmed.startsWith('"') && trimmed.endsWith('"')) ||
    (trimmed.startsWith("'") && trimmed.endsWith("'"))
  ) {
    return trimmed.slice(1, -1);
  }

  return trimmed;
}

function loadEnvFile(filePath) {
  if (!fs.existsSync(filePath)) {
    return;
  }

  const content = fs.readFileSync(filePath, "utf8");

  for (const line of content.split(/\r?\n/)) {
    const trimmed = line.trim();

    if (!trimmed || trimmed.startsWith("#") || !trimmed.includes("=")) {
      continue;
    }

    const index = trimmed.indexOf("=");
    const key = trimmed.slice(0, index).trim();
    const value = parseEnvValue(trimmed.slice(index + 1));

    if (key && process.env[key] === undefined) {
      process.env[key] = value;
    }
  }
}

export function loadLocalEnv() {
  const cwd = process.cwd();
  loadEnvFile(path.join(cwd, ".env.local"));
  loadEnvFile(path.join(cwd, "env.local"));
  loadEnvFile(path.join(cwd, ".env"));

  if (!process.env.DATABASE_URL) {
    process.env.DATABASE_URL =
      process.env.POSTGRES_URL ||
      process.env.PRISMA_DATABASE_URL ||
      process.env.PRISMA_URL ||
      "";
  }

  if (!process.env.POSTGRES_URL && process.env.DATABASE_URL) {
    process.env.POSTGRES_URL = process.env.DATABASE_URL;
  }
}
