/**
 * ===================================================================
 * SEED BỔ SUNG — Đảng viên ĐỦ ĐIỀU KIỆN Huy hiệu Đảng nhưng CHƯA được trao
 * (Học viện Khoa học Quân sự)
 * ===================================================================
 * Mỗi đảng viên có NgayVaoDang đã vượt một mốc niên hạn (30/40/45/50/55/60 năm)
 * và KhenThuongKyLuat.HuyHieuDang = "Chưa" → badgeDetection phát hiện đủ điều kiện.
 * Dữ liệu được điền ĐẦY ĐỦ mọi bảng quan hệ (lý lịch, vào Đảng, học vấn, quân ngũ,
 * sức khỏe, khen thưởng, đặc điểm, gia đình, công tác, đào tạo, quân hàm, đánh giá)
 * tương đương các hồ sơ gốc.
 *
 * ADDITIVE: không đụng tới các hồ sơ gốc trong seed.js. Xóa & tạo lại các hồ sơ
 * HHD-* (idempotent). Chạy: node prisma/seed_badge_eligible.js
 * ===================================================================
 */
require("dotenv").config();
const prisma = require("../src/infrastructure/database/prisma");

const yr = (s) => parseInt(String(s).slice(0, 4), 10);
const d = (y, m = 6, day = 15) => `${y}-${String(m).padStart(2, "0")}-${String(day).padStart(2, "0")}`;

// Thang quân hàm để dựng tiến trình thăng cấp
const RANK_LADDER = [
  "Thiếu úy", "Trung úy", "Thượng úy", "Đại úy", "Thiếu tá",
  "Trung tá", "Thượng tá", "Đại tá", "Thiếu tướng", "Trung tướng", "Thượng tướng",
];

const MEMBERS = [
  { SoTheDangVien: "HHD-30A", milestone: 30, HoTen: "Nguyễn Xuân Bắc", GioiTinh: "Nam", NgaySinh: "1968-03-15", NgayVaoDang: "1995-02-03", chiBo: "Chi bộ Tiếng Anh", CapBac: "Đại tá", spouse: "Phạm Thị Hoa" },
  { SoTheDangVien: "HHD-30B", milestone: 30, HoTen: "Trần Thị Bích Hồng", GioiTinh: "Nữ", NgaySinh: "1970-07-20", NgayVaoDang: "1996-05-19", chiBo: "Chi bộ Tiếng Trung", CapBac: "Thượng tá", spouse: "Đỗ Mạnh Hà" },
  { SoTheDangVien: "HHD-40A", milestone: 40, HoTen: "Lê Quang Vinh", GioiTinh: "Nam", NgaySinh: "1960-11-02", NgayVaoDang: "1986-02-03", chiBo: "Chi bộ Trinh sát Kỹ thuật", CapBac: "Đại tá", spouse: "Nguyễn Thị Lan" },
  { SoTheDangVien: "HHD-40B", milestone: 40, HoTen: "Phạm Đức Long", GioiTinh: "Nam", NgaySinh: "1959-09-12", NgayVaoDang: "1985-11-07", chiBo: "Chi bộ Quân báo", CapBac: "Đại tá", spouse: "Trần Thị Mai" },
  { SoTheDangVien: "HHD-45A", milestone: 45, HoTen: "Hoàng Minh Tuấn", GioiTinh: "Nam", NgaySinh: "1955-04-30", NgayVaoDang: "1980-09-02", chiBo: "Chi bộ Tiếng Anh", CapBac: "Thiếu tướng", spouse: "Lê Thị Bình" },
  { SoTheDangVien: "HHD-50A", milestone: 50, HoTen: "Đặng Văn Hùng", GioiTinh: "Nam", NgaySinh: "1950-01-25", NgayVaoDang: "1975-05-19", chiBo: "Chi bộ Tiếng Trung", CapBac: "Thiếu tướng", spouse: "Vũ Thị Tâm" },
  { SoTheDangVien: "HHD-55A", milestone: 55, HoTen: "Vũ Đình Phúc", GioiTinh: "Nam", NgaySinh: "1945-02-10", NgayVaoDang: "1970-02-03", chiBo: "Chi bộ Trinh sát Kỹ thuật", CapBac: "Trung tướng", spouse: "Ngô Thị Hạnh" },
  { SoTheDangVien: "HHD-60A", milestone: 60, HoTen: "Bùi Văn Sơn", GioiTinh: "Nam", NgaySinh: "1940-09-09", NgayVaoDang: "1965-09-02", chiBo: "Chi bộ Quân báo", CapBac: "Trung tướng", spouse: "Phan Thị Cúc" },

  // Bổ sung thêm để test giao diện xét huy hiệu (ưu tiên Chi bộ Quân báo)
  { SoTheDangVien: "HHD-30C", milestone: 30, HoTen: "Nguyễn Thị Mai Anh", GioiTinh: "Nữ", NgaySinh: "1969-06-12", NgayVaoDang: "1995-08-15", chiBo: "Chi bộ Quân báo", CapBac: "Thượng tá", spouse: "Lê Văn Hòa" },
  { SoTheDangVien: "HHD-40C", milestone: 40, HoTen: "Trịnh Văn Bốn", GioiTinh: "Nam", NgaySinh: "1961-03-22", NgayVaoDang: "1986-09-02", chiBo: "Chi bộ Quân báo", CapBac: "Đại tá", spouse: "Nguyễn Thị Thu" },
  { SoTheDangVien: "HHD-45B", milestone: 45, HoTen: "Cao Xuân Định", GioiTinh: "Nam", NgaySinh: "1956-10-05", NgayVaoDang: "1980-02-03", chiBo: "Chi bộ Tiếng Anh", CapBac: "Thiếu tướng", spouse: "Đặng Thị Nga" },
  { SoTheDangVien: "HHD-50B", milestone: 50, HoTen: "Lý Văn Năm", GioiTinh: "Nam", NgaySinh: "1951-07-19", NgayVaoDang: "1975-11-07", chiBo: "Chi bộ Trinh sát Kỹ thuật", CapBac: "Thiếu tướng", spouse: "Hoàng Thị Yến" },
];

// Dựng tiến trình thăng quân hàm: 4 bậc cuối dẫn đến CapBac hiện tại
function buildRankHistory(m) {
  const idx = RANK_LADDER.indexOf(m.CapBac);
  const start = Math.max(0, idx - 3);
  const ranks = RANK_LADDER.slice(start, idx + 1);
  const workStart = yr(m.NgaySinh) + 18;
  const n = ranks.length;
  return ranks.map((capBac, i) => {
    const year = Math.min(workStart + 6 + i * 8, 2022);
    return {
      CapBac: capBac,
      ChucVu: i === n - 1 ? "Chủ nhiệm bộ môn" : "Giảng viên / Cán bộ",
      DonVi: "Học viện Khoa học Quân sự",
      NgayHieuLuc: d(year, 8, 1),
      SoQuyetDinh: `QĐ-${100 + i * 37}/BQP`,
    };
  });
}

function buildCareer(m) {
  const ws = yr(m.NgaySinh) + 18;
  return [
    { TuThangNam: d(ws, 9, 1), DenThangNam: d(ws + 5, 7, 1), LamGiChucVuDonVi: "Học viên đào tạo sĩ quan, Học viện Khoa học Quân sự" },
    { TuThangNam: d(ws + 5, 8, 1), DenThangNam: d(ws + 18, 7, 1), LamGiChucVuDonVi: "Cán bộ giảng dạy, nghiên cứu, Học viện Khoa học Quân sự" },
    { TuThangNam: d(ws + 18, 8, 1), DenThangNam: null, LamGiChucVuDonVi: `Cán bộ chủ trì chuyên môn, ${m.chiBo}, Học viện Khoa học Quân sự` },
  ];
}

function buildTraining(m) {
  const ws = yr(m.NgaySinh) + 18;
  return [
    { TenTruong: "Học viện Khoa học Quân sự", NganhHoc: "Ngoại ngữ / Trinh sát - Quân báo quân sự", TuNgay: d(ws, 9, 1), DenNgay: d(ws + 5, 6, 30), HinhThuc: "Chính quy tập trung", VanBangChungChi: "Bằng Cử nhân/Kỹ sư" },
    { TenTruong: "Học viện Chính trị Quốc gia Hồ Chí Minh", NganhHoc: "Lý luận chính trị Cao cấp", TuNgay: d(ws + 12, 9, 1), DenNgay: d(ws + 14, 6, 30), HinhThuc: "Tại chức", VanBangChungChi: "Bằng Cao cấp LLCT" },
  ];
}

function buildFamily(m) {
  const by = yr(m.NgaySinh);
  const spouseRel = m.GioiTinh === "Nam" ? "Vợ" : "Chồng";
  return [
    { QuanHe: spouseRel, HoTen: m.spouse, NamSinh: String(by + 2), ThongTin: "Cán bộ hưu trí, sinh sống cùng gia đình tại Hà Nội" },
    { QuanHe: "Con trai", HoTen: `${m.HoTen.split(" ").slice(0, -1).join(" ")} Anh`, NamSinh: String(by + 27), ThongTin: "Sĩ quan Quân đội, công tác tại Hà Nội" },
    { QuanHe: "Con gái", HoTen: `${m.HoTen.split(" ").slice(0, -1).join(" ")} Chi`, NamSinh: String(by + 30), ThongTin: "Giáo viên" },
  ];
}

function buildEvaluations() {
  return [
    { Nam: 2023, XepLoai: "Tốt", NhanXet: "Hoàn thành tốt nhiệm vụ, gương mẫu, giữ vững phẩm chất đảng viên.", TrangThai: "APPROVED" },
    { Nam: 2024, XepLoai: "Xuất sắc", NhanXet: "Hoàn thành xuất sắc nhiệm vụ, có nhiều đóng góp cho đơn vị.", TrangThai: "APPROVED" },
    { Nam: 2025, XepLoai: "Tốt", NhanXet: "Nhất trí đề xuất Hoàn thành tốt nhiệm vụ năm 2025.", TrangThai: "DRAFT" },
  ];
}

async function createFullMember(m, orgId) {
  const dv = await prisma.dangVien.create({
    data: { toChucDangId: orgId, soLyLich: m.SoTheDangVien, soTheDangVien: m.SoTheDangVien, trangThai: "HOAT_DONG" },
  });
  const dvId = dv.id || dv.Id;
  const by = yr(m.NgaySinh);
  const jy = yr(m.NgayVaoDang);

  await prisma.lyLichCaNhan.create({
    data: {
      dangVienId: dvId,
      hoTenDangDung: m.HoTen, hoTenKhaiSinh: m.HoTen, gioiTinh: m.GioiTinh,
      ngaySinh: new Date(m.NgaySinh), noiSinh: "Hà Nội", queQuan: "Hà Nội",
      noiThuongTru: "Số 236 Hoàng Quốc Việt, Bắc Từ Liêm, Hà Nội",
      noiTamTru: "Số 236 Hoàng Quốc Việt, Bắc Từ Liêm, Hà Nội",
      danToc: "Kinh", tonGiao: "Không", thanhPhanGiaDinh: "Cán bộ, công chức",
      ngheNghiepHienNay: "Sĩ quan Quân đội", ngheNghiepKhiVaoDang: "Quân nhân",
    },
  });

  await prisma.thongTinVaoDang.create({
    data: {
      dangVienId: dvId,
      ngayVaoDang: new Date(m.NgayVaoDang), chiBoVaoDang: m.chiBo,
      nguoiGioiThieu1: "Đồng chí Bí thư chi bộ", chucVuNGT1: "Bí thư chi bộ",
      nguoiGioiThieu2: "Đồng chí đảng viên chính thức", chucVuNGT2: "Đảng viên chính thức",
      ngayQuyetDinhKetNap: new Date(m.NgayVaoDang),
      ngayChinhThuc: new Date(`${jy + 1}${m.NgayVaoDang.slice(4)}`),
      chiBoChinhThuc: m.chiBo, noiSinhHoatDang: m.chiBo, chucVuDang: "Đảng viên",
      ngayVaoDoan: new Date(d(by + 15, 3, 26)), toChucXaHoi: "Không",
    },
  });

  await prisma.trinhDoHocVan.create({
    data: {
      dangVienId: dvId, giaoDucPhoThong: "12/12", giaoDucDaiHoc: "Cử nhân/Kỹ sư",
      hocVi: "Cử nhân/Kỹ sư", lyLuanChinhTri: "Cao cấp", ngoaiNgu: "Tiếng Anh B1", tinHoc: "Thành thạo",
    },
  });

  await prisma.tuyenDungQuanNgu.create({
    data: {
      dangVienId: dvId, ngayNhapNgu: new Date(d(by + 18, 9, 1)),
      capBac: m.CapBac, congViecChinh: "Giảng dạy, nghiên cứu khoa học quân sự", coQuanTuyenDung: "Học viện Khoa học Quân sự",
    },
  });

  await prisma.sucKhoeChinhSach.create({
    data: { dangVienId: dvId, tinhTrangSucKhoe: "Tốt (Loại 1)", giaDinhCoCong: true },
  });

  // Mấu chốt: HuyHieuDang = "Chưa" → đủ điều kiện nhưng CHƯA được trao
  await prisma.khenThuongKyLuat.create({
    data: {
      dangVienId: dvId, khenThuong: "Nhiều Bằng khen của Bộ Quốc phòng và đơn vị",
      huyHieuDang: "Chưa", danhHieuPhongTang: "Chiến sĩ thi đua", kyLuat: "Không",
    },
  });

  await prisma.dacDiemLyLich.create({
    data: {
      dangVienId: dvId,
      lichSuBanThan: { bixoaten: "Không", ketNapLai: "Không", khoiPhucDangTich: "Không", xuLyPhapLuat: "Không", cheDocU: "Không" },
      quanHeNuocNgoai: { foreignTravel: "Không", foreignOrgs: "Không", foreignRelatives: "Không" },
      hoanCanhKinhTe: { totalIncome: "240.000.000đ/năm", perCapitaIncome: "60.000.000đ/năm", houseOwned: "Có (nhà ở Hà Nội)", landOwned: "Không", economicActivity: "Lương và phụ cấp", valuableAssets: "Không" },
    },
  });

  await prisma.quanHeGiaDinh.createMany({
    data: buildFamily(m).map((x) => ({
      dangVienId: dvId,
      quanHe: x.QuanHe,
      hoTen: x.HoTen,
      namSinh: x.NamSinh,
      thongTin: x.ThongTin,
    })),
  });

  await prisma.quaTrinhCongTac.createMany({
    data: buildCareer(m).map((x) => ({
      dangVienId: dvId,
      tuThangNam: new Date(x.TuThangNam),
      denThangNam: x.DenThangNam ? new Date(x.DenThangNam) : null,
      lamGiChucVuDonVi: x.LamGiChucVuDonVi,
    })),
  });

  await prisma.quaTrinhDaoTao.createMany({
    data: buildTraining(m).map((x) => ({
      dangVienId: dvId,
      tenTruong: x.TenTruong,
      nganhHoc: x.NganhHoc,
      tuNgay: new Date(x.TuNgay),
      denNgay: new Date(x.DenNgay),
      hinhThuc: x.HinhThuc,
      vanBangChungChi: x.VanBangChungChi,
    })),
  });

  await prisma.lichSuQuanHam.createMany({
    data: buildRankHistory(m).map((x) => ({
      dangVienId: dvId,
      capBac: x.CapBac,
      chucVu: x.ChucVu,
      donVi: x.DonVi,
      ngayHieuLuc: new Date(x.NgayHieuLuc),
      soQuyetDinh: x.SoQuyetDinh,
    })),
  });

  await prisma.danhGiaDangVien.createMany({
    data: buildEvaluations().map((x) => ({
      dangVienId: dvId,
      nam: x.Nam,
      xepLoai: x.XepLoai,
      nhanXet: x.NhanXet,
      trangThai: x.TrangThai,
    })),
  });

  return dv;
}

async function main() {
  console.log("🎖️  Seed bổ sung (FULL): đảng viên đủ điều kiện Huy hiệu Đảng, chưa được trao (Học viện Khoa học Quân sự)...");

  const orgs = await prisma.toChucDang.findMany({ select: { id: true, ten: true } });
  const orgByName = new Map(orgs.map((o) => [o.ten, o.id]));

  // ADDITIVE: chỉ tạo những hồ sơ HHD-* chưa tồn tại (giữ nguyên dữ liệu/đề nghị cũ).
  const existing = await prisma.dangVien.findMany({ where: { soTheDangVien: { startsWith: "HHD-" } }, select: { soTheDangVien: true } });
  const existingSet = new Set(existing.map((e) => e.soTheDangVien));

  let created = 0;
  let skipped = 0;
  for (const m of MEMBERS) {
    const orgId = orgByName.get(m.chiBo);
    if (!orgId) {
      console.warn(`  ⚠️  Bỏ qua ${m.SoTheDangVien}: không tìm thấy chi bộ "${m.chiBo}"`);
      continue;
    }
    if (existingSet.has(m.SoTheDangVien)) {
      skipped++;
      continue;
    }
    await createFullMember(m, orgId);
    console.log(`  ✅ ${m.SoTheDangVien} — ${m.HoTen} | mốc ${m.milestone} năm | vào Đảng ${m.NgayVaoDang} | ${m.chiBo}`);
    created++;
  }

  console.log(`\n🎖️  Hoàn tất: tạo mới ${created} hồ sơ, bỏ qua ${skipped} hồ sơ đã tồn tại.`);
}

main()
  .catch((e) => { console.error("❌ Lỗi seed:", e); process.exitCode = 1; })
  .finally(async () => { process.exit(process.exitCode || 0); });
