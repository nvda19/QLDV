# Hệ thống Quản lý Đảng viên

Hệ thống quản lý hồ sơ Đảng viên, tổ chức Đảng, đánh giá xếp loại, huy hiệu Đảng và báo cáo thống kê, dành cho môi trường quân đội.

- **Backend**: Node.js, Express (v5), Prisma ORM, PostgreSQL (Neon Cloud), JWT, bcryptjs, ExcelJS, Multer, Adm-Zip
- **Frontend**: React (v19), Vite, Axios, React Router DOM (v7)

## Cấu trúc dự án

```
quan-ly-dang-vien/
├── backend/          # API Server (Express + Prisma + PostgreSQL)
│   ├── src/          # Source code
│   ├── prisma/       # Schema, migrations, seed data
│   ├── certs/        # Chứng chỉ HTTPS local (tự tạo, không commit)
│   ├── package.json
│   └── .env          # Biến môi trường (tự tạo từ .env.example)
│
├── frontend/         # Giao diện (React + Vite)
│   ├── src/
│   ├── package.json
│   └── vite.config.js
│
└── README.md
```

## Yêu cầu môi trường

- Node.js >= 18
- Một database PostgreSQL — khuyến nghị dùng [Neon](https://neon.tech) (miễn phí, không cần cài local)
- Git

## 1. Cài đặt Backend

```bash
cd backend
npm install
```

### 1.1. Cấu hình biến môi trường

```bash
cp .env.example .env
```

Mở `backend/.env` và điền giá trị thật:

| Biến | Mô tả |
|---|---|
| `DATABASE_URL` | Chuỗi kết nối PostgreSQL. Với Neon: lấy tại Neon Dashboard → Connection Details, giữ nguyên `?sslmode=require` ở cuối |
| `JWT_SECRET` / `JWT_REFRESH_SECRET` | Chuỗi ngẫu nhiên bảo mật riêng của bạn. Tạo bằng: `node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"` |
| `DATA_ENCRYPTION_KEY` | Đúng 32 ký tự, dùng mã hóa dữ liệu nhạy cảm của đảng viên trong DB |
| `PORT` | Cổng chạy backend (mặc định `3000`) |
| `NODE_ENV` | `development` khi chạy local |

⚠️ **Không commit file `.env`** — đã nằm trong `.gitignore`. Mỗi người tự giữ giá trị thật riêng, không chia sẻ qua Git.

### 1.2. Khởi tạo database

```bash
npx prisma generate      # sinh Prisma Client
npx prisma db push       # đồng bộ schema lên database
```

Nạp dữ liệu mẫu (tùy chọn, có thể xóa/thay bằng dữ liệu thật sau):

```bash
node prisma/seed.js                  # tổ chức Đảng + 10 hồ sơ đảng viên mẫu
node prisma/seed_badge_eligible.js   # tùy chọn: thêm dữ liệu test tính năng Huy hiệu Đảng
```

### 1.3. (Tùy chọn) Chứng chỉ HTTPS cho local dev

Backend tự chạy HTTPS nếu có `backend/certs/key.pem` và `backend/certs/cert.pem`; không có sẽ tự rơi về HTTP. Frontend (Vite) mặc định proxy `/api` sang `https://localhost:3000`, nên nên tạo chứng chỉ để dev nhất quán:

```bash
mkcert -install
mkdir -p certs
mkcert -key-file certs/key.pem -cert-file certs/cert.pem localhost
```

Thư mục `backend/certs/` đã nằm trong `.gitignore` — mỗi người tự tạo chứng chỉ riêng, không chia sẻ qua Git.

### 1.4. Chạy backend

```bash
npm run dev      # nodemon, tự reload khi sửa code
```

Backend chạy tại `https://localhost:3000` (hoặc `http://` nếu không có chứng chỉ).

## 2. Cài đặt Frontend

```bash
cd frontend
npm install
npm run dev
```

Truy cập: `http://localhost:5173` (tự động proxy `/api`, `/uploads` sang backend).

## 3. Tài khoản mặc định (sau khi chạy `prisma/seed.js`)

Mật khẩu chung: `123456` (bắt buộc đổi mật khẩu ở lần đăng nhập đầu).

| Username | Vai trò | Đơn vị |
|---|---|---|
| `canbo_hv` | Cán bộ chính trị | Đảng ủy Học viện Khoa học Quân sự |
| `bithu_ngoaingu` | Bí thư | Đảng bộ Khoa Ngoại ngữ |
| `bithu_tienganh` | Bí thư | Chi bộ Tiếng Anh |
| `bithu_tiengtrung` | Bí thư | Chi bộ Tiếng Trung |
| `bithu_trinhsat` | Bí thư | Đảng bộ Khoa Trinh sát - Quân báo |
| `bithu_tskt` | Bí thư | Chi bộ Trinh sát Kỹ thuật |
| `bithu_quanbao` | Bí thư | Chi bộ Quân báo |

## 4. Kiểm thử

```bash
cd backend && npm test     # Jest
cd frontend && npm test    # Vitest
```

## 5. Build production

```bash
cd frontend
npm run build
```

Copy nội dung `frontend/dist/` vào `backend/public/` — backend tự phục vụ frontend tĩnh và fallback SPA cho mọi route không khớp API.

## Phân quyền theo vai trò

| Vai trò | Phạm vi |
|---|---|
| `BI_THU` (Bí thư) | Chỉ quản lý đúng chi bộ/đơn vị mình phụ trách |
| `CAN_BO_CHINH_TRI` (Cán bộ chính trị) | Quản lý ở cấp đảng bộ cao nhất, không thao tác trực tiếp vào các chi bộ/đảng bộ trực thuộc |
