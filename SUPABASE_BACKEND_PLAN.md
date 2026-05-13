# Supabase 后台迁移方案（JPMAG-GIFT）

## 1. 目标
- 使用 Supabase Auth 实现后台登录。
- 使用 Supabase Postgres 存储杂志、赠品、公告数据。
- 保留现有静态前台（GitHub Pages），通过 Supabase JS 拉取已发布内容。

## 2. 表结构（最小可用）
- `magazines`
- `gifts`
- `announcements`

详见：`supabase/schema.sql`

## 3. 权限模型（RLS）
- 游客：仅可读取 `published=true` 内容。
- 管理员：可增删改查。

管理员通过 `profiles.role='admin'` 判断。

## 4. 登录方式
- 推荐：Email OTP（简单稳定）
- 可选：GitHub OAuth（需配置 callback）

## 5. 前台读取策略
- 首页读取 `gifts`（`published=true`）并按 `published_at desc` 排序。
- 杂志页按 `magazine_slug` 过滤。
- 公告仅读取发布状态。

## 6. 迁移步骤
1. 在 Supabase 创建项目并执行 `supabase/schema.sql`。
2. 在 Auth 开启 Email 登录（可选 GitHub OAuth）。
3. 创建首个管理员账号，并在 `profiles` 中设 `role=admin`。
4. 用后台页面完成 CRUD。
5. 前台页面改为调用 Supabase。

## 7. 环境变量
前台（公开）：
- `SUPABASE_URL`
- `SUPABASE_ANON_KEY`

服务端（保密，不进前端）：
- `SUPABASE_SERVICE_ROLE_KEY`
