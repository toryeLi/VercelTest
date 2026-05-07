import { ensureUsersTable, getSql } from "../../lib/db.js";

function json(data, init = {}) {
  return Response.json(data, {
    headers: {
      "Cache-Control": "no-store"
    },
    ...init
  });
}

function getUserId(request) {
  const pathname = new URL(request.url).pathname;
  const match = pathname.match(/\/api\/users\/(\d+)\/?$/);
  return match ? Number(match[1]) : Number.NaN;
}

export async function PUT(request) {
  const userId = getUserId(request);

  if (!Number.isInteger(userId) || userId <= 0) {
    return json(
      {
        success: false,
        message: "无效的用户 ID。"
      },
      { status: 400 }
    );
  }

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

    const updated = await sql`
      UPDATE users
      SET name = ${name}, email = ${email}
      WHERE id = ${userId}
      RETURNING id, name, email, created_at
    `;

    if (updated.length === 0) {
      return json(
        {
          success: false,
          message: "用户不存在。"
        },
        { status: 404 }
      );
    }

    return json({
      success: true,
      data: updated[0]
    });
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

export async function DELETE(request) {
  const userId = getUserId(request);

  if (!Number.isInteger(userId) || userId <= 0) {
    return json(
      {
        success: false,
        message: "无效的用户 ID。"
      },
      { status: 400 }
    );
  }

  try {
    await ensureUsersTable();
    const sql = getSql();
    const deleted = await sql`
      DELETE FROM users
      WHERE id = ${userId}
      RETURNING id
    `;

    if (deleted.length === 0) {
      return json(
        {
          success: false,
          message: "用户不存在。"
        },
        { status: 404 }
      );
    }

    return json({
      success: true,
      message: "删除成功。"
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
