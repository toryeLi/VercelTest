import { ensureUsersTable, getSql } from "../../lib/db.js";

function sendJson(res, statusCode, payload) {
  res.statusCode = statusCode;
  res.setHeader("Content-Type", "application/json; charset=utf-8");
  res.setHeader("Cache-Control", "no-store");
  res.end(JSON.stringify(payload));
}

async function readJsonBody(req) {
  return await new Promise((resolve) => {
    let raw = "";

    req.on("data", (chunk) => {
      raw += chunk;
    });

    req.on("end", () => {
      if (!raw) {
        resolve({});
        return;
      }

      try {
        resolve(JSON.parse(raw));
      } catch {
        resolve({});
      }
    });
  });
}

export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET,POST,OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") {
    res.statusCode = 200;
    return res.end();
  }

  try {
    await ensureUsersTable();
    const sql = getSql();

    if (req.method === "GET") {
      const rows = await sql`
        SELECT id, name, email, created_at
        FROM users
        ORDER BY id DESC
      `;

      return sendJson(res, 200, {
        success: true,
        data: rows
      });
    }

    if (req.method === "POST") {
      const body = await readJsonBody(req);
      const name = String(body.name || "").trim();
      const email = String(body.email || "").trim().toLowerCase();

      if (!name || !email) {
        return sendJson(res, 400, {
          success: false,
          message: "name 和 email 为必填项。"
        });
      }

      const inserted = await sql`
        INSERT INTO users (name, email)
        VALUES (${name}, ${email})
        RETURNING id, name, email, created_at
      `;

      return sendJson(res, 201, {
        success: true,
        data: inserted[0]
      });
    }

    return sendJson(res, 405, {
      success: false,
      message: "Method Not Allowed"
    });
  } catch (error) {
    const message =
      error && error.code === "23505"
        ? "该邮箱已存在，请使用其他邮箱。"
        : error.message || "服务器内部错误。";

    return sendJson(res, 500, {
      success: false,
      message
    });
  }
}
