import { ensureUsersTable, prisma } from "../../lib/db.js";

function sendJson(res, statusCode, payload) {
  res.statusCode = statusCode;
  res.setHeader("Content-Type", "application/json; charset=utf-8");
  res.setHeader("Cache-Control", "no-store");
  res.end(JSON.stringify(payload));
}

function mapUser(user) {
  return {
    id: user.id,
    name: user.name,
    email: user.email,
    created_at: user.createdAt
  };
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

      const updated = await prisma.user.update({
        where: { id: userId },
        data: { name, email }
      });

      return sendJson(res, 200, {
        success: true,
        data: mapUser(updated)
      });
    }

    if (req.method === "DELETE") {
      await prisma.user.delete({
        where: { id: userId }
      });

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
      error?.code === "P2025"
        ? "用户不存在。"
        : error?.code === "P2002"
          ? "该邮箱已存在，请使用其他邮箱。"
          : error.message || "服务器内部错误。";

    return sendJson(res, 500, {
      success: false,
      message
    });
  }
}
