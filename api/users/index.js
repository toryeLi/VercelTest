import { ensureUsersTable, getSql } from "../../lib/db.js";

function json(data, init = {}) {
  return Response.json(data, {
    headers: {
      "Cache-Control": "no-store"
    },
    ...init
  });
}

export async function GET() {
  try {
    await ensureUsersTable();
    const sql = getSql();
    const rows = await sql`
      SELECT id, name, email, created_at
      FROM users
      ORDER BY id DESC
    `;

    return json({
      success: true,
      data: rows
    });
  } catch (error) {
    return json(
      {
        success: false,
        message: error.message || "服务器内部错误。"
      },
      { status: 500 }
    );
  }
}

export async function POST(request) {
  try {
    await ensureUsersTable();
    const sql = getSql();
    const body = await request.json().catch(() => ({}));
    const name = String(body.name || "").trim();
    const email = String(body.email || "").trim().toLowerCase();

    if (!name || !email) {
      return json(
        {
          success: false,
          message: "name 和 email 为必填项。"
        },
        { status: 400 }
      );
    }

    const inserted = await sql`
      INSERT INTO users (name, email)
      VALUES (${name}, ${email})
      RETURNING id, name, email, created_at
    `;

    return json(
      {
        success: true,
        data: inserted[0]
      },
      { status: 201 }
    );
  } catch (error) {
    const message =
      error && error.code === "23505"
        ? "该邮箱已存在，请使用其他邮箱。"
        : error.message || "服务器内部错误。";

    return json(
      {
        success: false,
        message
      },
      { status: 500 }
    );
  }
}
