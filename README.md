# Vercel 用户 CRUD 示例

这是一个可直接部署到 Vercel 的最小全栈项目，包含：

- 前端：原生 `HTML + JavaScript`
- 后端：`/api` 目录下的 Vercel Node.js Functions
- 数据库：通过 Vercel Marketplace 接入的 Postgres（当前推荐使用 Neon）
- 功能：查看用户列表、添加用户、更新用户、删除用户

## 项目结构

```txt
.
├─ api/
│  └─ users/
│     ├─ [id].js
│     └─ index.js
├─ lib/
│  └─ db.js
├─ .env.example
├─ .gitignore
├─ index.html
├─ package.json
├─ README.md
└─ vercel.json
```

## 本地启动

1. 安装依赖

```bash
npm install
```

2. 配置环境变量

将 `.env.example` 复制为 `.env.local`，并填入你的 Postgres 连接串：

```bash
POSTGRES_URL=postgres://username:password@hostname/database?sslmode=require
```

3. 启动本地开发

```bash
npm run dev
```

默认使用 `vercel dev`，会同时提供静态页面和 `/api` 接口。

## 部署到 Vercel

1. 将项目推送到 GitHub
2. 在 Vercel 中导入该仓库
3. 在 Vercel Marketplace 添加 Postgres 集成
   当前新项目建议直接使用 Neon 集成，Vercel 会注入 `POSTGRES_URL` 或兼容连接变量
4. 点击 Deploy

## API 说明

### `GET /api/users`

返回用户列表。

### `POST /api/users`

请求体：

```json
{
  "name": "张三",
  "email": "zhangsan@example.com"
}
```

### `PUT /api/users/:id`

请求体：

```json
{
  "name": "李四",
  "email": "lisi@example.com"
}
```

### `DELETE /api/users/:id`

删除指定用户。

## 说明

- 接口首次调用时会自动执行建表：

```sql
CREATE TABLE IF NOT EXISTS users (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  email TEXT NOT NULL UNIQUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
```

- 这是一个最小 CRUD 示例，未包含鉴权、分页和输入校验库。如需我继续扩成生产级结构，可以在这个基础上继续补。
