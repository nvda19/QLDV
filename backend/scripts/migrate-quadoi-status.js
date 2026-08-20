/**
 * Migration dữ liệu MỘT LẦN: chuẩn hóa trạng thái đảng viên "QUA_DOIS" -> "QUA_DOI".
 *
 * Trước đây dropdown lưu nhầm giá trị "QUA_DOIS" (thừa chữ S). Sau khi sửa dropdown,
 * các bản ghi cũ vẫn mang "QUA_DOIS" nên cần cập nhật lại cho khớp.
 *
 * Cách chạy (một lần, sau khi đã backup DB):
 *   cd backend && node scripts/migrate-quadoi-status.js
 */
const prisma = require("../src/infrastructure/database/prisma");

async function main() {
  const before = await prisma.dangVien.count({ where: { TrangThai: "QUA_DOIS" } });
  console.log(`Số đảng viên đang ở trạng thái "QUA_DOIS": ${before}`);

  if (before === 0) {
    console.log("Không có bản ghi nào cần cập nhật.");
    return;
  }

  const result = await prisma.dangVien.updateMany({
    where: { TrangThai: "QUA_DOIS" },
    data: { TrangThai: "QUA_DOI" },
  });
  console.log(`Đã cập nhật ${result.count} bản ghi "QUA_DOIS" -> "QUA_DOI".`);
}

main()
  .catch((err) => {
    console.error("Migration thất bại:", err);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
