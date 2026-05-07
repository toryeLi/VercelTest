const { ensureUsersTable, getSql } = require("../../lib/db");

module.exports = async function handler(req, res) {
  res.setHeader("Content-Type", "application/json; charset=utf-8");
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET,POST,OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") {
    return res.status(200).end();
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

      return res.status(200).json({
        success: true,
        data: rows
      });
    }

    if (req.method === "POST") {
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

      const inserted = await sql`
        INSERT INTO users (name, email)
        VALUES (${name}, ${email})
        RETURNING id, name, email, created_at
      `;

      return res.status(201).json({
        success: true,
        data: inserted[0]
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
