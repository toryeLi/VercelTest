import { ensureUsersTable, getSql } from "../../lib/db.js";

function sendJson(res, statusCode, payload) {
  res.statusCode = statusCode;
  res.setHeader("Content-Type", "application/json; charset=utf-8");
  res.setHeader("Cache-Control", "no-store");
  res.end(JSON.stringify(payload));
}

function getUserId(req) {
  const match = req.url.match(/\/api\/users\/(\d+)\/?$/);
  return match ? Number(match[1]) : Number.NaN;
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
  res.setHeader("Access-Control-Allow-Methods", "PUT,DELETE,OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") {
    res.statusCode = 200;
    return res.end();
  }

  const userId = getUserId(req);

  if (!Number.isInteger(userId) || userId <= 0) {
    return sendJson(res, 400, {
      success: false,
      message: "无效的用户 ID。"
    });
  }

  try {
    await ensureUsersTable();
    const sql = getSql();

    if (req.method === "PUT") {
      const body = await readJsonBody(req);
      const name = String(body.name || "").trim();
      const email = String(body.email || "").trim().toLowerCase();

      if (!name || !email) {
        return sendJson(res, 400, {
          success: false,
          message: "name 和 email 为必填项。"
        });
      }

      const updated = await sql`
        UPDATE users
        SET name = ${name}, email = ${email}
        WHERE id = ${userId}
        RETURNING id, name, email, created_at
      `;

      if (updated.length === 0) {
        return sendJson(res, 404, {
          success: false,
          message: "用户不存在。"
        });
      }

      return sendJson(res, 200, {
        success: true,
        data: updated[0]
      });
    }

    if (req.method === "DELETE") {
      const deleted = await sql`
        DELETE FROM users
        WHERE id = ${userId}
        RETURNING id
      `;

      if (deleted.length === 0) {
        return sendJson(res, 404, {
          success: false,
          message: "用户不存在。"
        });
      }

      return sendJson(res, 200, {
        success: true,
        message: "删除成功。"
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
