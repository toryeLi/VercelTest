const { ensureUsersTable, getSql } = require("../../lib/db");

module.exports = async function handler(req, res) {
  res.setHeader("Content-Type", "application/json; charset=utf-8");
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "PUT,DELETE,OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") {
    return res.status(200).end();
  }

  const { id } = req.query;
  const userId = Number(id);

  if (!Number.isInteger(userId) || userId <= 0) {
    return res.status(400).json({
      success: false,
      message: "无效的用户 ID。"
    });
  }

  try {
    await ensureUsersTable();
    const sql = getSql();

    if (req.method === "PUT") {
      const body =
        typeof req.body === "string" ? JSON.parse(req.body || "{}") : req.body || {};
      const name = String(body.name || "").trim();
      const email = String(body.email || "").trim().toLowerCase();

      if (!name || !email) {
        return res.status(400).json({
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
        return res.status(404).json({
          success: false,
          message: "用户不存在。"
        });
      }

      return res.status(200).json({
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
        return res.status(404).json({
          success: false,
          message: "用户不存在。"
        });
      }

      return res.status(200).json({
        success: true,
        message: "删除成功。"
      });
    }

    return res.status(405).json({
      success: false,
      message: "Method Not Allowed"
    });
  } catch (error) {
    const message =
      error && error.code === "23505"
        ? "该邮箱已存在，请使用其他邮箱。"
        : error.message || "服务器内部错误。";

    return res.status(500).json({
      success: false,
      message
    });
  }
};
