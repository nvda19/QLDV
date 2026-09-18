# NHẬT KÝ SỬA ĐỔI VÀ NÂNG CẤP DỰ ÁN (CHANGELOG)
**Hệ thống Quản lý Đảng viên**

Tài liệu này ghi lại chi tiết toàn bộ các hoạt động sửa đổi, nâng cấp, vá lỗi và bổ sung tính năng trong quá trình phát triển dự án.

---

## [2026-09-18] - Chuẩn hóa Database Schema (camelCase), Khắc phục lỗi Prisma & Tối ưu UI Sidebar

### 1. Mục tiêu và bối cảnh
* **Vấn đề**: Project gặp lỗi sau khi sửa đổi các bảng trong `schema.prisma`. Khi chạy thực tế, backend văng lỗi `ColumnNotFound` do database PostgreSQL (Neon DB) chưa đồng bộ các cột và ENUM mới; `prisma db push` bị chặn vì thiếu `@default(now())` cho cột `updatedAt`; một số truy vấn trong service vẫn còn gọi theo format PascalCase cũ.
* **Mục tiêu**: Chuẩn hóa toàn bộ schema sang chuẩn camelCase, đồng bộ an toàn dữ liệu trên PostgreSQL, khắc phục lỗi query và đảm bảo toàn bộ test suites đều đạt 100%.

### 2. Chi tiết các thay đổi

#### A. Database & Prisma Schema (`backend/prisma/schema.prisma`)
* **Chuẩn hóa quy ước đặt tên**: Chuyển toàn bộ tên trường của 20 model sang chuẩn `camelCase` (ví dụ: `Id` -> `id`, `HoTenDangDung` -> `hoTenDangDung`, `SoLyLich` -> `soLyLich`, ...).
* **Bổ sung giá trị cho các ENUM**:
  * `TrangThaiDangVien`: Thêm `DU_BI`, `CHUYEN_DI`, `XOA_TEN`, `KHAI_TRU`, `TU_TRAN`.
  * `TrangThaiPheDuyet`: Thêm `DISMISSED`.
  * `LoaiQuyetDinh`: Thêm `XEP_LOAI`, `KY_LUAT`.
  * `LoaiThongBao`: Thêm `BADGE_ELIGIBLE`, `BADGE_PROPOSED`, `BADGE_APPROVED`, `BADGE_REJECTED`.
* **Thêm trường mới & Khắc phục lỗi Default Value**:
  * Thêm `@default(now())` cho `updatedAt` ở model `NguoiDung` và `DanhGiaDangVien` để tránh lỗi `NOT NULL` khi bảng đã chứa dữ liệu.
  * Thêm `createdAt` cho model `DanhGiaDangVien`.
  * Thêm `soDienThoai` (VarChar 20), `anhChanDungUrl` (VarChar 500) vào `LyLichCaNhan`.
  * Nâng giới hạn `TaiLieuDinhKem.fileType` từ `VarChar(10)` lên `VarChar(30)` để hỗ trợ định dạng `.docx` và file tài liệu văn phòng.
  * Thêm ràng buộc duy nhất `@@unique([dangVienId, nam])` cho bảng `DanhGiaDangVien`.
  * Thêm các `@@index` phục vụ tối ưu hóa truy vấn cho các bảng.

#### B. Đồng bộ trực tiếp PostgreSQL (Neon DB)
* Thực hiện script di chuyển cấu trúc an toàn (không làm mất dữ liệu):
  * Cập nhật các ENUM với `ALTER TYPE ... ADD VALUE IF NOT EXISTS`.
  * Bổ sung các cột mới với `ALTER TABLE ... ADD COLUMN IF NOT EXISTS`.
  * Mở rộng độ dài cột `fileType` với `ALTER TABLE ... ALTER COLUMN TYPE`.
  * Tạo unique index và các chỉ mục tìm kiếm với `CREATE INDEX / UNIQUE INDEX IF NOT EXISTS`.

#### C. Backend Repositories, Services, Mappers & Tests
* **Repositories (10 files)**:
  * `audit.repository.js`, `badge.repository.js`, `decision.repository.js`, `notification.repository.js`, `org.repository.js`, `user.repository.js`, `member/member.repository.js`, `member/memberAttachment.repository.js`, `member/memberHistory.repository.js`, `member/memberParty.repository.js`.
  * Cập nhật query Prisma theo camelCase. Bổ sung các hàm adapter gắn alias PascalCase (`attachDangVienAliases`, `attachBadgeAliases`, `attachDecisionAliases`, ...) để duy trì tính tương thích ngược với code nghiệp vụ tầng trên.
* **Services**:
  * `member.service.js`: Khắc phục lỗi truy vấn PascalCase ở đoạn đồng bộ quân hàm (`prisma.quyetDinh.findUnique({ where: { id } })`, `where: { soQuyetDinh }`, lấy `ngayBanHanh`).
  * `badgeMilestoneSync.service.js`, `memberImport.service.js`, `decisionResolver.service.js`: Đồng bộ query camelCase.
* **Mappers**:
  * `member.mapper.js`, `decision.mapper.js`, `memberEvaluation.mapper.js`: Ánh xạ tương thích hai chiều giữa camelCase DB và DTO frontend.
* **Tests**:
  * Cập nhật các mock data và test cases trong `backend/tests/`. Kết quả: **28/28 test suites PASSED, 292/292 tests PASSED**.

#### D. Frontend UI / UX (`frontend/src/components/layout/Sidebar.jsx`, `frontend/src/index.css`)
* **Thiết kế lại Sidebar**:
  * Chuyển đổi từ dạng hover mở rộng ngang (expand hover) sang dạng thanh menu gọn gàng cố định (compact sidebar).
  * Hiển thị icon kèm nhãn chữ nhỏ ngay bên dưới (`.sidebar-sublabel`).
  * Bổ sung Tooltip nổi hiển thị tên mục đầy đủ và badge số lượng thông báo khi rê chuột (`.sidebar-tooltip`).
  * Ẩn phần tiêu đề phân nhóm và footer vai trò để giao diện tối giản, tập trung vào không gian làm việc.

---

## Hướng dẫn cập nhật nhật ký cho các lần sau
Mỗi khi có hoạt động chỉnh sửa mã nguồn, quy trình ghi nhận nhật ký gồm:
1. **Ngày & Tiêu đề**: Ghi rõ ngày thực hiện và nội dung cốt lõi của đợt sửa đổi.
2. **Bối cảnh / Lý do**: Nêu rõ yêu cầu của người dùng hoặc lỗi phát sinh cần sửa.
3. **Danh sách file bị thay đổi & Chi tiết kỹ thuật**: Liệt kê các file được tạo mới/chỉnh sửa kèm theo nguyên nhân kỹ thuật.
4. **Kết quả kiểm thử**: Kết quả chạy test (Jest, Vitest), build (Vite) và trạng thái hệ thống sau khi chỉnh sửa.
