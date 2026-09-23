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

## [2026-09-19] - Bổ sung Vai trò Đảng viên (DANG_VIEN), Phân quyền & Tinh chỉnh Nguyên tắc Hoạt động các Role

### 1. Mục tiêu và bối cảnh
* **Yêu cầu từ người dùng**:
  1. **Thêm vai trò Đảng viên (`DANG_VIEN` / User)**: Chỉ được phép xem hồ sơ của chính bản thân mình (thông tin cá nhân, lịch sử quân hàm, quá trình công tác/đào tạo), các khen thưởng, kỷ luật và quyết định liên quan đến bản thân. Không thể xem dữ liệu đảng viên khác và không có quyền sửa hồ sơ.
  2. **Vai trò Bí thư chi bộ (`BI_THU`)**: Chỉ được phép xem và quản lý trong phạm vi chi bộ của mình; tuyệt đối không được thêm tài khoản người dùng cho đảng viên (chức năng quản trị tài khoản là đặc quyền của Admin); có quyền đề xuất khen thưởng / xét duyệt huy hiệu Đảng cho các đảng viên trong chi bộ mình phụ trách.
  3. **Vai trò Cán bộ chính trị (`CAN_BO_CHINH_TRI` / Admin)**: Có toàn quyền xem hồ sơ toàn đảng bộ, quản lý tổ chức, tạo tài khoản người dùng cho cán bộ, bí thư và liên kết tài khoản cho đảng viên. **Đặc biệt**: Admin không cần đề xuất khen thưởng / huy hiệu (các đề xuất xuất phát từ Bí thư chi bộ, Admin đóng vai trò xét duyệt/phê duyệt hoặc từ chối).

### 2. Chi tiết các thay đổi

#### A. Database & Schema Prisma (`backend/prisma/schema.prisma`)
* Cập nhật `enum VaiTro`: Bổ sung thêm giá trị `DANG_VIEN`. Đã thực thi trực tiếp trên PostgreSQL Neon DB qua `ALTER TYPE "VaiTro" ADD VALUE 'DANG_VIEN'`.
* Bổ sung liên kết 1-1 giữa tài khoản `NguoiDung` và hồ sơ `DangVien`:
  * Thêm cột `dangVienId UUID UNIQUE REFERENCES "DangVien"("id") ON DELETE SET NULL` vào bảng `NguoiDung`.
  * Tạo chỉ mục tìm kiếm `CREATE INDEX "NguoiDung_dangVienId_idx" ON "NguoiDung"("dangVienId")`.
  * Cập nhật quan hệ Prisma: `dangVien DangVien? @relation(...)` trên `NguoiDung` và `nguoiDung NguoiDung?` trên `DangVien`.
  * Chạy `npx prisma generate` sinh lại Prisma Client thành công.

#### B. Hằng số & Phân quyền Backend
* **Constants**: Cập nhật `ROLES.DANG_VIEN = "DANG_VIEN"` trong `backend/src/domain/constants/member.constants.js` và `frontend/src/utils/constants.js` (nhãn hiển thị: `"Đảng viên"`).
* **Chính sách phân quyền (`backend/src/domain/policies/member.policy.js`)**:
  * `validateWritePermission`: Chặn vai trò `DANG_VIEN` thực hiện mọi thao tác ghi/sửa/xóa hồ sơ đảng viên (`"Đảng viên không có quyền chỉnh sửa hồ sơ"`).
  * Bổ sung hàm `validateReadPermission(memberId, user)`: Kiểm soát chặt chẽ quyền đọc hồ sơ:
    * Nếu là `DANG_VIEN`: Chỉ cho phép đọc khi `memberId === user.memberId || user.dangVienId`. Truy cập hồ sơ người khác sẽ trả về lỗi cấm truy cập 403.
    * Nếu là `BI_THU`: Chỉ cho phép đọc hồ sơ thuộc chi bộ/tổ chức đảng của mình hoặc hồ sơ đã có vết audit lịch sử.
    * Nếu là `CAN_BO_CHINH_TRI`: Cho phép đọc hồ sơ toàn hệ thống.

#### C. Dịch vụ & Xử lý Nghiệp vụ Backend
* **Xác thực & Token (`backend/src/services/auth.service.js`)**:
  * Đưa `memberId: user.dangVienId || user.DangVienId` vào payload của JWT access token (`generateAccessToken`).
  * Trả về trường `memberId` và thông tin đảng viên liên kết trong API `login` và `getMe`.
* **Quản trị người dùng (`backend/src/services/user.service.js`, `backend/src/repositories/user.repository.js`)**:
  * Thêm hàm `findByMemberId(dangVienId)` trong `user.repository.js`.
  * Khi tạo user với role `DANG_VIEN`: Bắt buộc cung cấp `dangVienId`, kiểm tra hồ sơ đảng viên có tồn tại hay không, kiểm tra hồ sơ đảng viên chưa liên kết với tài khoản nào khác (`"Hồ sơ Đảng viên này đã có tài khoản người dùng"`), tự động đồng bộ `orgId` theo chi bộ và họ tên của đảng viên.
  * Giữ nguyên phân quyền trong `backend/src/routes/user.routes.js` chỉ cho phép `ROLES.CAN_BO_CHINH_TRI` (Bí thư không có quyền truy cập hay tạo user).
* **Quản lý Quyết định (`backend/src/controllers/decision.controller.js`, `backend/src/services/decision/decision.service.js`, `backend/src/repositories/decision.repository.js`)**:
  * Truyền `req.user` vào `getAllDecisions` và `getDecisionById`.
  * Với `DANG_VIEN`: Tự động lọc danh sách quyết định chỉ bao gồm các quyết định có liên kết tới `memberId` của đảng viên (thông qua bảng `danhGiaDangViens`, `lichSuQuanHams`, `deXuatHuyHieus`, `khenThuongKyLuats`).
  * Kiểm tra quyền đọc chi tiết quyết định: Nếu quyết định không liên quan tới đảng viên đang đăng nhập, chặn truy cập với mã lỗi 403.
  * Bổ sung `khenThuongKyLuats` vào `decisionDetailInclude` và alias `khenThuongKyLuats` trong `decision.repository.js`.
  * Mở quyền `GET /` và `GET /:id` trong `backend/src/routes/decision.routes.js` cho `ROLES.DANG_VIEN`.
* **Quản lý Đề xuất Huy hiệu (`backend/src/routes/member.routes.js`)**:
  * Chuyển quyền route đề xuất cá nhân `POST /:id/badges/propose` thành riêng cho `ROLES.BI_THU` (Cán bộ chính trị không tự đề xuất mà chỉ duyệt danh sách từ chi bộ).

#### D. Giao diện Người dùng (Frontend)
* **Bảo vệ Route (`frontend/src/components/ProtectedRoute.jsx`, `frontend/src/App.jsx`)**:
  * Thêm hỗ trợ thuộc tính `allowedRoles` trong `ProtectedRoute`. Nếu người dùng không đủ quyền, tự động điều hướng an toàn về trang chủ thay vì báo lỗi.
  * Khóa các route `/organizations`, `/statistics/*`, `/evaluations`, `/badges`, `/users`, `/members/new`, `/members/:id/edit` đối với vai trò `DANG_VIEN`.
* **Thanh điều hướng Sidebar (`frontend/src/components/layout/Sidebar.jsx`)**:
  * Khi đăng nhập với vai trò `DANG_VIEN`, sidebar tự động chuyển sang chế độ cá nhân gọn gàng: chỉ hiển thị **Bảng điều khiển**, **Thông báo**, **Hồ sơ của tôi** (`/members/:id`), và **Văn bản & Quyết định** (`/decisions`).
  * Ẩn toàn bộ các mục Quản trị tổ chức, Thống kê đảng số, Báo cáo cấp ủy, Bình xét xếp loại, Xét tặng huy hiệu và Quản lý tài khoản.
* **Bảng điều khiển Trang chủ (`frontend/src/pages/DashboardPage.jsx`)**:
  * Xây dựng giao diện Dashboard chuyên biệt cho Đảng viên: Hero banner chào mừng đ/c đảng viên, các thẻ điều hướng nhanh (Hồ sơ lý lịch, Quyết định khen thưởng, Thông báo) và bảng tóm tắt lý lịch (Số thẻ Đảng, Số lý lịch, Ngày vào Đảng, Ngày chính thức, Cấp bậc, Chức vụ, Khen thưởng).
* **Danh sách & Chi tiết Đảng viên (`frontend/src/pages/members/MemberListPage.jsx`, `frontend/src/components/members/DetailToolbar.jsx`)**:
  * Trong `MemberListPage`: Nếu là `DANG_VIEN`, tự động redirect tới trang chi tiết hồ sơ cá nhân `/members/:id`.
  * Trong `DetailToolbar`: Ẩn nút "Quay lại danh sách" cho `DANG_VIEN`, ẩn hoàn toàn các nút "Chỉnh sửa hồ sơ" và "Xóa".
* **Quản lý Quyết định (`frontend/src/pages/decisions/DecisionManagePage.jsx`)**:
  * Kiểm tra quyền `canManage`: Ẩn nút "Thêm Quyết định", ẩn cột Thao tác (Sửa, Xóa) khi người dùng là `DANG_VIEN`, chỉ cho phép xem nội dung và tải tài liệu đính kèm.
* **Xét tặng Huy hiệu (`frontend/src/pages/badges/BadgeEvaluationPage.jsx`)**:
  * Nút "Đề xuất thủ công" chỉ hiển thị khi là `isBiThu` (Admin không có nút đề xuất thủ công mà chỉ thẩm định, phê duyệt và xuất quyết định).
* **Quản lý Tài khoản (`frontend/src/pages/users/UserManagePage.jsx`)**:
  * Bổ sung vai trò "Đảng viên" vào danh mục chọn vai trò.
  * Khi chọn vai trò Đảng viên, hiển thị ô tìm kiếm và chọn hồ sơ Đảng viên để liên kết (hiển thị Họ tên, Số thẻ, Chi bộ sinh hoạt). Tự động điền họ tên và chi bộ theo hồ sơ được chọn.

### 3. Kết quả Kiểm thử & Biên dịch
* **Backend Unit Tests (`Jest`)**: Đã cập nhật mock cho `validateReadPermission`, `findByMemberId` và bổ sung test cases cho vai trò `DANG_VIEN`.
  * **28/28 test suites PASSED (100%)**
  * **296/296 tests PASSED (100%)**
* **Frontend Unit Tests (`Vitest`)**:
  * **2/2 test files PASSED (100%)**
  * **48/48 tests PASSED (100%)**
* **Frontend Production Build (`Vite`)**:
  * `vite build` hoàn thành thành công trong 604ms, không có bất kỳ lỗi cú pháp hay thiếu import nào.

---

## [2026-09-19] - Khắc phục Toàn diện Chức năng Tạo mới & Chỉnh sửa Hồ sơ Đảng viên

### 1. Mục tiêu và bối cảnh
* **Vấn đề**: Người dùng phản hồi *"chức năng tạo đảng viên mới hình như vẫn chưa hoạt động ổn nhỉ"*.
* **Nguyên nhân cốt lõi phát hiện được sau khi rà soát toàn diện**:
  1. **Lỗi logic phân quyền backend (`member.service.js`)**: Trong hàm `createMember`, hệ thống cũ kiểm tra `userOrg.ToChucChaId !== null` đối với `CAN_BO_CHINH_TRI`, đồng thời ép buộc lưu đảng viên vào `user.orgId` của người tạo. Khi tài khoản Cán bộ chính trị có `orgId = null` (tài khoản quản trị cấp cao) hoặc thuộc một đơn vị trực thuộc, hệ thống lập tức ném lỗi `"Bạn không có quyền thêm hồ sơ mới"`, chặn hoàn toàn Cán bộ chính trị tạo đảng viên.
  2. **Thiếu chọn Tổ chức Đảng trên giao diện (`MemberFormPage.jsx`, `PartyMembershipSection.jsx`)**: Biểu mẫu thêm đảng viên hoàn toàn không có trường chọn Chi bộ / Tổ chức Đảng quản lý (`toChucDangId`). Form chỉ có trường chuỗi tự do `noiSinhHoatDang`. Do đó, payload gửi lên backend không có `ToChucDangId`, khiến đảng viên tạo ra không thể gắn vào Chi bộ tương ứng mà Admin mong muốn.
  3. **Chặn quyền sửa của Admin đối với Chi bộ con (`member.policy.js` và `MemberFormPage.jsx`)**:
     * Backend `validateWritePermission`: Chặn `CAN_BO_CHINH_TRI` chỉnh sửa đảng viên nếu `ToChucDang.ToChucChaId !== null` (tức tất cả các chi bộ con).
     * Frontend `MemberFormPage`: Điều kiện `canEdit = isCanBo && m.ToChucDang?.ParentId === null` khiến Admin bị báo lỗi `"Bạn không có quyền chỉnh sửa hồ sơ này!"` và bị điều hướng ra ngoài khi mở hồ sơ đảng viên chi bộ.

### 2. Chi tiết các thay đổi

#### A. Backend Policies & Services
* **Chính sách phân quyền (`backend/src/domain/policies/member.policy.js`)**:
  * Gỡ bỏ hoàn toàn điều kiện giới hạn `CAN_BO_CHINH_TRI` chỉ được sửa cấp Đảng bộ gốc. Xác lập đúng quyền hạn Admin: Cán bộ chính trị có toàn quyền quản trị, thêm mới, xem, chỉnh sửa và xóa hồ sơ đảng viên trong toàn hệ thống.
* **Nghiệp vụ Tạo & Cập nhật Đảng viên (`backend/src/services/member/member.service.js`)**:
  * **Hàm `createMember`**:
    * Với `DANG_VIEN`: Chặn và ném lỗi `"Đảng viên không có quyền thêm mới hồ sơ."`.
    * Với `BI_THU`: Tự động gắn đảng viên vào Chi bộ do Bí thư phụ trách (`targetOrgId = user.orgId`). Chặn nếu gửi `ToChucDangId` khác chi bộ của mình.
    * Với `CAN_BO_CHINH_TRI`: Lấy `targetOrgId` từ dữ liệu gửi lên (`data.ToChucDangId || data.toChucDangId || data.orgId || user.orgId`).
    * Validate bắt buộc phải có `targetOrgId` và tổ chức Đảng phải tồn tại trong cơ sở dữ liệu (`orgRepository.findById`).
    * Gán chính xác `targetOrgId` vào bảng gốc `DangVien` (`saveDangVien(data, targetOrgId, true, null)`).
  * **Hàm `updateMember`**:
    * Cho phép `CAN_BO_CHINH_TRI` chuyển sinh hoạt Đảng (chuyển đổi Chi bộ quản lý) cho đảng viên khi cập nhật `ToChucDangId`.
* **Cập nhật Unit Tests (`backend/tests/services/member.service.test.js`)**:
  * Cập nhật các test case cho `createMember` phản ánh đúng nghiệp vụ: `DANG_VIEN` bị chặn, `CAN_BO_CHINH_TRI` bắt buộc chọn tổ chức và tạo thành công vào đúng chi bộ đã chọn, `BI_THU` tự động gắn vào chi bộ mình và bị chặn nếu chọn chi bộ khác.
  * Toàn bộ **28/28 test suites PASSED, 298/298 tests PASSED (100%)**.

#### B. Frontend UI Form (`MemberFormPage.jsx`, `PartyMembershipSection.jsx`)
* **`frontend/src/pages/members/MemberFormPage.jsx`**:
  * Bổ sung `toChucDangId: ''` vào `initialFormData`.
  * Tích hợp `orgApi.getAll()` tải danh sách Tổ chức Đảng khi nạp trang.
  * Khi mở form tạo mới với vai trò `BI_THU`: Tự động gán `toChucDangId = user.orgId`.
  * Trong `fetchMember`:
    * Sửa điều kiện `canEdit`: Cho phép `CAN_BO_CHINH_TRI` chỉnh sửa mọi đảng viên (`(isBiThu && m.ToChucDangId === user?.orgId) || isCanBo`).
    * Ánh xạ đúng `toChucDangId: m.ToChucDangId || m.toChucDangId || ''` vào state form.
  * Trong `validate()`: Kiểm tra bắt buộc chọn Chi bộ đối với Cán bộ chính trị khi tạo mới.
  * Trong `handleSubmit()`: Bổ sung `ToChucDangId: formData.toChucDangId || (user?.role === ROLES.BI_THU ? user?.orgId : undefined)` vào payload gửi lên API.
  * Truyền `organizations`, `user`, `isEdit` vào `PartyMembershipSection`.
* **`frontend/src/components/members/PartyMembershipSection.jsx`**:
  * Thiết kế lại Mục 14 (Nơi sinh hoạt Đảng hiện nay):
    * Thêm ô chọn **"Tổ chức Đảng (Chi bộ) quản lý sinh hoạt *"**:
      * Với `CAN_BO_CHINH_TRI`: Hiển thị dropdown `GlassSelect` danh sách toàn bộ Chi bộ / Tổ chức Đảng; tự động gợi ý điền tên chi bộ vào ô "Nơi sinh hoạt Đảng hiện nay" khi chọn.
      * Với `BI_THU`: Hiển thị tên Chi bộ do mình phụ trách ở dạng badge/hộp thông tin cố định rõ ràng, không cho phép chọn nhầm sang chi bộ khác.
    * Đầy đủ hiển thị thông báo lỗi validate (`errors?.toChucDangId`).

### 3. Kết quả Kiểm thử & Biên dịch
* **Backend Unit Tests**: **28/28 test suites (298/298 tests) PASSED (100%)**.
* **Frontend Unit Tests**: **2/2 test files (48/48 tests) PASSED (100%)**.
* **Frontend Build**: `npm run build` thành công rực rỡ, không phát sinh bất kỳ lỗi nào.

---

## [2026-09-19] - Sửa Lỗi "userInclude is not defined" Khi Tạo Tài Khoản Người Dùng

### 1. Mục tiêu và bối cảnh
* **Vấn đề**: Khi tạo tài khoản người dùng (đặc biệt là tài khoản liên kết vai trò Đảng viên `DANG_VIEN`), API trả về lỗi:
  ```json
  {"success":false,"message":"userInclude is not defined"}
  ```
* **Nguyên nhân cốt lõi**:
  * Khi tạo tài khoản vai trò `DANG_VIEN`, hệ thống gọi hàm kiểm tra xem hồ sơ đảng viên đã được liên kết với tài khoản nào chưa thông qua `userRepository.findByMemberId(dangVienId)`.
  * Trong file `backend/src/repositories/user.repository.js`, hàm `findByMemberId` thực hiện truy vấn Prisma:
    ```javascript
    const user = await prisma.nguoiDung.findFirst({
      where: { dangVienId },
      include: userInclude,
    });
    ```
  * Biến `userInclude` chưa được khai báo ở đầu file `user.repository.js` (gây ra lỗi `ReferenceError: userInclude is not defined` khi thực thi).
  * Trong các hàm `create` và `update` của `user.repository.js`, quan hệ `dangVien` cũng chưa được include đầy đủ khi trả về.

### 2. Chi tiết các thay đổi
* **File `backend/src/repositories/user.repository.js`**:
  * Khai báo hằng số `userDetailInclude` và alias `userInclude`:
    ```javascript
    const userDetailInclude = {
      toChucDang: true,
      dangVien: {
        include: {
          lyLichCaNhan: true,
        },
      },
    };
    const userInclude = userDetailInclude;
    ```
  * Cập nhật các hàm `findByMemberId`, `create`, `update` sử dụng `userDetailInclude` để nạp đầy đủ thông tin `toChucDang` và `dangVien.lyLichCaNhan`.
* **Thêm Unit Test cho Repository (`backend/tests/repositories/user.repository.test.js`)**:
  * Tạo test suite kiểm thử trực tiếp `userRepository`: `findByMemberId`, `findById`, `findByUsername`, `create`.
  * Đảm bảo không xảy ra lỗi `ReferenceError` khi gọi các hàm query liên kết đảng viên.

### 3. Kết quả Kiểm thử & Trạng thái Hệ thống
* **Backend Tests**: **29/29 test suites (303/303 tests) PASSED (100%)**.
* **Frontend Tests & Build**: **48/48 tests PASSED, Vite build PASSED**.

---

## Hướng dẫn cập nhật nhật ký cho các lần sau
Mỗi khi có hoạt động chỉnh sửa mã nguồn, quy trình ghi nhận nhật ký gồm:
1. **Ngày & Tiêu đề**: Ghi rõ ngày thực hiện và nội dung cốt lõi của đợt sửa đổi.
2. **Bối cảnh / Lý do**: Nêu rõ yêu cầu của người dùng hoặc lỗi phát sinh cần sửa.
3. **Danh sách file bị thay đổi & Chi tiết kỹ thuật**: Liệt kê các file được tạo mới/chỉnh sửa kèm theo nguyên nhân kỹ thuật.
4. **Kết quả kiểm thử**: Kết quả chạy test (Jest, Vitest), build (Vite) và trạng thái hệ thống sau khi chỉnh sửa.
