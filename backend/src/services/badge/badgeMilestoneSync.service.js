const memberRepository = require("../../repositories/member/member.repository");

/**
 * Ghi mốc huy hiệu vừa được duyệt vào HuyHieuDang (KhenThuongKyLuat) — trường này lưu
 * dạng chuỗi liệt kê các mốc đã nhận (vd "30 năm tuổi Đảng, 40 năm tuổi Đảng") để hiển
 * thị trực tiếp trên hồ sơ đảng viên mà không cần join sang bảng đề xuất mỗi lần xem.
 * Nhận tx tùy chọn để gọi được từ trong transaction ngoài (duyệt hàng loạt).
 */
const syncBadgeMilestone = async (memberId, MocHuyHieu, tx = null) => {
  const prismaClient = tx || require("../../infrastructure/database/prisma");
  const milestoneStr = `${MocHuyHieu} năm tuổi Đảng`;
  const member = await prismaClient.dangVien.findUnique({
    where: { id: memberId },
    include: { khenThuongKyLuat: true },
  });
  if (!member) return;

  const ktkl = member.khenThuongKyLuat || member.KhenThuongKyLuat;
  const currentBadge = (ktkl && (ktkl.huyHieuDang !== undefined ? ktkl.huyHieuDang : ktkl.HuyHieuDang)) || "";
  // tránh nối trùng nếu mốc này lỡ được đồng bộ hai lần
  let newBadge;
  if (
    !currentBadge ||
    currentBadge === "Chưa" ||
    currentBadge === "Không" ||
    currentBadge.trim() === ""
  ) {
    newBadge = milestoneStr;
  } else if (!currentBadge.includes(milestoneStr)) {
    newBadge = `${currentBadge}, ${milestoneStr}`;
  } else {
    newBadge = currentBadge;
  }

  await prismaClient.khenThuongKyLuat.upsert({
    where: { dangVienId: memberId },
    create: { dangVienId: memberId, huyHieuDang: newBadge },
    update: { huyHieuDang: newBadge },
  });
};

module.exports = { syncBadgeMilestone };
