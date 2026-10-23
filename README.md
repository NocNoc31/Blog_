# nét mực.

Blog cá nhân viết bằng Astro, chạy SSR trên Vercel, dùng Better Auth + Drizzle ORM + PostgreSQL.

## Yêu cầu

- Node.js `22.23.4` trở lên
- Docker + Docker Compose
- npm

## Cài đặt lần đầu

```bash
nvm use
npm ci
cp .env.example .env
```

Tạo secret cho auth:

```bash
openssl rand -base64 32
```

Điền giá trị vừa tạo vào `BETTER_AUTH_SECRET` trong `.env`.

Các biến local mặc định:

```dotenv
PUBLIC_SITE_URL=http://localhost:4321
BETTER_AUTH_URL=http://localhost:4321
DATABASE_URL=postgresql://blog:blog_local_password@localhost:5432/blog
```

## Bật PostgreSQL bằng Docker

```bash
docker compose up -d postgres
```

Kiểm tra container:

```bash
docker compose ps
```

Kết quả mong đợi: container `net-muc-postgres` ở trạng thái `healthy`.

Xem log:

```bash
docker compose logs -f postgres
```

Chạy migration:

```bash
npm run db:migrate
```

Chạy dev server:

```bash
npm run dev
```

Mở `http://localhost:4321`.

Astro dev server chạy nền. Các lệnh quản lý:

```bash
npx astro dev status
npx astro dev logs
npx astro dev stop
```

## Dữ liệu PostgreSQL nằm ở đâu?

Dữ liệu được mount vào thư mục trong project:

```text
/home/locpd7/Blog_/.data/postgres
```

Trong container:

```text
/var/lib/postgresql/data
```

Thư mục này thuộc user `postgres` (UID `70`) và có quyền `700`, nên user thường sẽ thấy `Permission denied` hoặc thư mục có vẻ trống. Đây là bình thường.

Xem dữ liệu từ host:

```bash
sudo ls -la /home/locpd7/Blog_/.data/postgres
```

Xem dung lượng từ container:

```bash
docker exec net-muc-postgres du -sh /var/lib/postgresql/data
```

Không sửa quyền hoặc chỉnh file trực tiếp trong thư mục này.

`.data/` đã nằm trong `.gitignore`, Git sẽ không commit database local.

## Kiểm tra database

Mở PostgreSQL:

```bash
docker exec -it net-muc-postgres psql -U blog -d blog
```

Trong `psql`:

```sql
\dt
\d "user"
```

Thoát:

```sql
\q
```

### Đếm dữ liệu

```bash
docker exec net-muc-postgres psql -U blog -d blog -c '
SELECT
  (SELECT count(*) FROM "user") AS users,
  (SELECT count(*) FROM session) AS sessions,
  (SELECT count(*) FROM saved_posts) AS saved_posts,
  (SELECT count(*) FROM security_events) AS security_events;'
```

### Danh sách tài khoản đã đăng ký

```bash
docker exec net-muc-postgres psql -U blog -d blog -c '
SELECT name, email, email_verified, created_at
FROM "user"
ORDER BY created_at DESC;'
```

### Kiểm tra mật khẩu có được lưu hay không

Mật khẩu không lưu dạng plaintext. Better Auth lưu hash scrypt trong `account.password`.

```bash
docker exec net-muc-postgres psql -U blog -d blog -c '
SELECT
  u.email,
  a.provider_id,
  a.password IS NOT NULL AS has_password,
  length(a.password) AS hash_length
FROM "user" u
LEFT JOIN account a ON a.user_id = u.id
ORDER BY u.created_at DESC;'
```

Không thể xem lại mật khẩu gốc. Nếu quên mật khẩu, dùng chức năng đặt lại mật khẩu.

### Danh sách bài đã lưu

```bash
docker exec net-muc-postgres psql -U blog -d blog -c '
SELECT u.email, s.post_title, s.post_slug, s.created_at
FROM saved_posts s
JOIN "user" u ON u.id = s.user_id
ORDER BY s.created_at DESC;'
```

### Phiên đăng nhập

```bash
docker exec net-muc-postgres psql -U blog -d blog -c '
SELECT u.email, s.expires_at, s.ip_address, s.created_at
FROM session s
JOIN "user" u ON u.id = s.user_id
ORDER BY s.created_at DESC;'
```

### Sự kiện bảo mật

```bash
docker exec net-muc-postgres psql -U blog -d blog -c '
SELECT event, ip_address, metadata, created_at
FROM security_events
ORDER BY created_at DESC
LIMIT 20;'
```

## Tài khoản và email khi chạy local

- Đọc blog không cần đăng nhập.
- Đăng ký tại `/dang-ky`.
- Đăng nhập tại `/dang-nhap`.
- Quản lý tài khoản tại `/tai-khoan`.
- Đăng ký không tự gửi email xác thực. Vào `/tai-khoan/bao-mat` để yêu cầu gửi.
- Khi chưa cấu hình Resend, email xác thực và email đặt lại mật khẩu chỉ được ghi ra log:

```bash
npx astro dev logs
```

Không có mật khẩu mặc định cho tài khoản mới. Mật khẩu do người đăng ký tự đặt.

## Backup và restore

Backup toàn bộ database:

```bash
docker exec net-muc-postgres pg_dump -U blog -Fc blog > "backup-$(date +%F-%H%M).dump"
```

Restore:

```bash
cat backup-2026-10-23-1200.dump | docker exec -i net-muc-postgres pg_restore -U blog -d blog --clean --if-exists
```

Nên dừng dev server trước khi restore.

## Dừng và reset database local

Dừng container, giữ dữ liệu:

```bash
docker compose stop postgres
```

Xóa container, giữ dữ liệu:

```bash
docker compose down
```

Reset toàn bộ database local:

```bash
docker compose down
docker run --rm -v "$PWD/.data:/data" alpine rm -rf /data/postgres
mkdir -p .data/postgres
docker compose up -d postgres
npm run db:migrate
```

Cảnh báo: lệnh reset xóa toàn bộ tài khoản, bài đã lưu và phiên đăng nhập local.

## Kiểm tra chất lượng trước khi commit

```bash
npm run check
npm run build
```

## Deploy production

Production cần PostgreSQL bên ngoài như Neon, Supabase hoặc Vercel Postgres. Không dùng thư mục `.data/postgres` local.

Biến môi trường trên Vercel:

```dotenv
PUBLIC_SITE_URL=https://your-domain.com
BETTER_AUTH_URL=https://your-domain.com
BETTER_AUTH_SECRET=<secret-32-bytes>
DATABASE_URL=<pooled-postgresql-url>
RESEND_API_KEY=<resend-api-key>
EMAIL_FROM=nét mực. <no-reply@your-domain.com>
```

Sau khi cấu hình database production:

```bash
DATABASE_URL="<production-url>" npm run db:migrate
```

Sau đó deploy bằng Vercel Git integration hoặc Vercel CLI.
