require("dotenv").config();
const prisma = require("../src/infrastructure/database/prisma");
const bcrypt = require("bcryptjs");

async function createFullDangVien(data, orgMap) {
  const orgId = orgMap[data.toChucDangName];
  if (!orgId) {
    throw new Error(`Không tìm thấy tổ chức Đảng: ${data.toChucDangName}`);
  }

  const dv = await prisma.dangVien.create({
    data: {
      ToChucDangId: orgId,
      SoLyLich: data.SoLyLich,
      SoTheDangVien: data.SoTheDangVien,
      TrangThai: data.TrangThai || "HOAT_DONG",
    },
  });

  const dvId = dv.Id;

  await prisma.lyLichCaNhan.create({
    data: {
      DangVienId: dvId,
      HoTenDangDung: data.HoTenDangDung,
      HoTenKhaiSinh: data.HoTenKhaiSinh,
      GioiTinh: data.GioiTinh,
      NgaySinh: new Date(data.NgaySinh),
      NoiSinh: data.NoiSinh,
      QueQuan: data.QueQuan,
      NoiThuongTru: data.NoiThuongTru || null,
      NoiTamTru: data.NoiTamTru || null,
      DanToc: data.DanToc || "Kinh",
      TonGiao: data.TonGiao || "Không",
      ThanhPhanGiaDinh: data.ThanhPhanGiaDinh,
      NgheNghiepHienNay: data.NgheNghiepHienNay || null,
      NgheNghiepKhiVaoDang: data.NgheNghiepKhiVaoDang || null,
      SoCMND: data.SoCMND || null,
      SoCMTQD: data.SoCMTQD || null,
    },
  });

  await prisma.thongTinVaoDang.create({
    data: {
      DangVienId: dvId,
      NgayVaoDang: data.NgayVaoDang ? new Date(data.NgayVaoDang) : null,
      ChiBoVaoDang: data.ChiBoVaoDang || null,
      NguoiGioiThieu1: data.NguoiGioiThieu1 || null,
      ChucVuNGT1: data.ChucVuNGT1 || null,
      NguoiGioiThieu2: data.NguoiGioiThieu2 || null,
      ChucVuNGT2: data.ChucVuNGT2 || null,
      NgayQuyetDinhKetNap: data.NgayQuyetDinhKetNap
        ? new Date(data.NgayQuyetDinhKetNap)
        : null,
      NgayChinhThuc: data.NgayChinhThuc ? new Date(data.NgayChinhThuc) : null,
      ChiBoChinhThuc: data.ChiBoChinhThuc || null,
      NoiSinhHoatDang: data.NoiSinhHoatDang || null,
      ChucVuDang: data.ChucVuDang || null,
      NgayVaoDoan: data.NgayVaoDoan ? new Date(data.NgayVaoDoan) : null,
      ToChucXaHoi: data.ToChucXaHoi || null,
      NgayMienCongTac: data.NgayMienCongTac
        ? new Date(data.NgayMienCongTac)
        : null,
    },
  });

  await prisma.trinhDoHocVan.create({
    data: {
      DangVienId: dvId,
      GiaoDucPhoThong: data.GiaoDucPhoThong || "12/12",
      GiaoDucNgheNghiep: data.GiaoDucNgheNghiep || null,
      GiaoDucDaiHoc: data.GiaoDucDaiHoc || null,
      HocVi: data.HocVi || null,
      HocHam: data.HocHam || null,
      LyLuanChinhTri: data.LyLuanChinhTri || "Sơ cấp",
      NgoaiNgu: data.NgoaiNgu || null,
      TinHoc: data.TinHoc || null,
    },
  });

  await prisma.tuyenDungQuanNgu.create({
    data: {
      DangVienId: dvId,
      NgayTuyenDung: data.NgayTuyenDung ? new Date(data.NgayTuyenDung) : null,
      CoQuanTuyenDung: data.CoQuanTuyenDung || null,
      NgayNhapNgu: data.NgayNhapNgu ? new Date(data.NgayNhapNgu) : null,
      NgayXuatNgu: data.NgayXuatNgu ? new Date(data.NgayXuatNgu) : null,
      NgayTaiNgu: data.NgayTaiNgu ? new Date(data.NgayTaiNgu) : null,
      CapBac: data.CapBac || null,
      CongViecChinh: data.CongViecChinh || null,
    },
  });

  await prisma.sucKhoeChinhSach.create({
    data: {
      DangVienId: dvId,
      TinhTrangSucKhoe: data.TinhTrangSucKhoe || "Tốt (Loại 1)",
      ThuongBinhLoai: data.ThuongBinhLoai || null,
      GiaDinhLietSy: data.GiaDinhLietSy || false,
      GiaDinhCoCong: data.GiaDinhCoCong || false,
    },
  });

  await prisma.khenThuongKyLuat.create({
    data: {
      DangVienId: dvId,
      KhenThuong: data.KhenThuong || "Chưa",
      HuyHieuDang: data.HuyHieuDang || "Chưa",
      DanhHieuPhongTang: data.DanhHieuPhongTang || "Chưa",
      KyLuat: data.KyLuat || "Không",
    },
  });

  await prisma.dacDiemLyLich.create({
    data: {
      DangVienId: dvId,
      LichSuBanThan: data.LichSuBanThan || {
        bixoaten: "Không",
        ketNapLai: "Không",
        khoiPhucDangTich: "Không",
        xuLyPhapLuat: "Không",
        cheDocU: "Không",
      },
      QuanHeNuocNgoai: data.QuanHeNuocNgoai || {
        foreignTravel: "Không",
        foreignOrgs: "Không",
        foreignRelatives: "Không",
      },
      HoanCanhKinhTe: data.HoanCanhKinhTe || {
        totalIncome: "120.000.000đ/năm",
        perCapitaIncome: "40.000.000đ/năm",
        houseOwned: "Không",
        landOwned: "Không",
        economicActivity: "Không",
        valuableAssets: "Không",
      },
    },
  });

  if (data.QuanHeGiaDinh && data.QuanHeGiaDinh.length > 0) {
    await prisma.quanHeGiaDinh.createMany({
      data: data.QuanHeGiaDinh.map((item) => ({ DangVienId: dvId, ...item })),
    });
  }

  if (data.QuaTrinhCongTac && data.QuaTrinhCongTac.length > 0) {
    await prisma.quaTrinhCongTac.createMany({
      data: data.QuaTrinhCongTac.map((item) => ({
        DangVienId: dvId,
        TuThangNam: new Date(item.TuThangNam),
        DenThangNam: item.DenThangNam ? new Date(item.DenThangNam) : null,
        LamGiChucVuDonVi: item.LamGiChucVuDonVi,
      })),
    });
  }

  if (data.QuaTrinhDaoTao && data.QuaTrinhDaoTao.length > 0) {
    await prisma.quaTrinhDaoTao.createMany({
      data: data.QuaTrinhDaoTao.map((item) => ({
        DangVienId: dvId,
        TenTruong: item.TenTruong,
        NganhHoc: item.NganhHoc,
        TuNgay: new Date(item.TuNgay),
        DenNgay: new Date(item.DenNgay),
        HinhThuc: item.HinhThuc,
        VanBangChungChi: item.VanBangCert || null,
      })),
    });
  }

  if (data.LichSuQuanHam && data.LichSuQuanHam.length > 0) {
    await prisma.lichSuQuanHam.createMany({
      data: data.LichSuQuanHam.map((item) => ({
        DangVienId: dvId,
        CapBac: item.CapBac,
        ChucVu: item.ChucVu || null,
        DonVi: item.DonVi,
        NgayHieuLuc: new Date(item.NgayHieuLuc),
        SoQuyetDinh: item.SoQuyetDinh,
      })),
    });
  }

  if (data.DanhGiaDangVien && data.DanhGiaDangVien.length > 0) {
    await prisma.danhGiaDangVien.createMany({
      data: data.DanhGiaDangVien.map((item) => ({
        DangVienId: dvId,
        Nam: item.Nam,
        XepLoai: item.XepLoai,
        NhanXet: item.NhanXet || null,
        TrangThai: item.TrangThai || "APPROVED",
        SoQuyetDinh: item.SoQuyetDinh || null,
      })),
    });
  }

  return dv;
}

async function main() {
  console.log(
    "🌱 Bắt đầu seed dữ liệu mới toàn diện (Học viện Khoa học Quân sự)...",
  );

  try {
    // 1. Xóa dữ liệu cũ theo đúng thứ tự khóa ngoại bằng raw SQL để tránh soft delete
    console.log("🗑️  Đang xóa dữ liệu cũ...");
    const tables = [
      "NhatKyHeThong",
      "ThongBao",
      "TaiLieuDinhKem",
      "QuanHeGiaDinh",
      "QuaTrinhCongTac",
      "QuaTrinhDaoTao",
      "DanhGiaDangVien",
      "LichSuQuanHam",
      "LyLichCaNhan",
      "ThongTinVaoDang",
      "TrinhDoHocVan",
      "TuyenDungQuanNgu",
      "SucKhoeChinhSach",
      "KhenThuongKyLuat",
      "DacDiemLyLich",
      "DangVien",
      "NguoiDung",
      "ToChucDang",
    ];
    for (const table of tables) {
      await prisma.$executeRawUnsafe(`DELETE FROM "${table}";`);
    }
    console.log("🗑️  Xóa dữ liệu cũ hoàn tất.");

    // 2. Tạo Tổ chức Đảng (Cơ cấu Học viện Khoa học Quân sự)
    console.log("\n📍 Đang tạo danh sách Tổ chức Đảng...");
    const dangUyHocVien = await prisma.toChucDang.create({
      data: { Ten: "Đảng bộ Học viện Khoa học Quân sự" },
    });

    const dangBoNgoaiNgu = await prisma.toChucDang.create({
      data: { Ten: "Đảng bộ Khoa Ngoại ngữ", ToChucChaId: dangUyHocVien.Id },
    });

    const dangBoTrinhSat = await prisma.toChucDang.create({
      data: {
        Ten: "Đảng bộ Khoa Trinh sát - Quân báo",
        ToChucChaId: dangUyHocVien.Id,
      },
    });

    const chiBoTiengAnh = await prisma.toChucDang.create({
      data: { Ten: "Chi bộ Tiếng Anh", ToChucChaId: dangBoNgoaiNgu.Id },
    });

    const chiBoTiengTrung = await prisma.toChucDang.create({
      data: { Ten: "Chi bộ Tiếng Trung", ToChucChaId: dangBoNgoaiNgu.Id },
    });

    const chiBoTrinhSatKyThuat = await prisma.toChucDang.create({
      data: {
        Ten: "Chi bộ Trinh sát Kỹ thuật",
        ToChucChaId: dangBoTrinhSat.Id,
      },
    });

    const chiBoQuanBao = await prisma.toChucDang.create({
      data: { Ten: "Chi bộ Quân báo", ToChucChaId: dangBoTrinhSat.Id },
    });

    const orgMap = {
      "Đảng bộ Học viện Khoa học Quân sự": dangUyHocVien.Id,
      "Đảng bộ Khoa Ngoại ngữ": dangBoNgoaiNgu.Id,
      "Đảng bộ Khoa Trinh sát - Quân báo": dangBoTrinhSat.Id,
      "Chi bộ Tiếng Anh": chiBoTiengAnh.Id,
      "Chi bộ Tiếng Trung": chiBoTiengTrung.Id,
      "Chi bộ Trinh sát Kỹ thuật": chiBoTrinhSatKyThuat.Id,
      "Chi bộ Quân báo": chiBoQuanBao.Id,
    };

    console.log(`  ✅ Đã tạo các tổ chức Đảng`);

    // 3. Tạo tài khoản người dùng
    const hashedPassword = await bcrypt.hash("123456", 10);

    console.log("\n👤 Đang tạo tài khoản người dùng...");
    await prisma.nguoiDung.create({
      data: {
        TenDangNhap: "canbo_hv",
        MatKhauHash: hashedPassword,
        VaiTro: "CAN_BO_CHINH_TRI",
        ToChucDangId: dangUyHocVien.Id,
        HoTen: "Cán bộ Chính trị Học viện",
        TrangThai: "ACTIVE",
      },
    });

    // Bí thư Đảng bộ Khoa Ngoại ngữ
    await prisma.nguoiDung.create({
      data: {
        TenDangNhap: "bithu_ngoaingu",
        MatKhauHash: hashedPassword,
        VaiTro: "BI_THU",
        ToChucDangId: dangBoNgoaiNgu.Id,
        HoTen: "Bí thư Đảng bộ Khoa Ngoại ngữ",
        TrangThai: "ACTIVE",
      },
    });

    // Bí thư Chi bộ Tiếng Anh
    await prisma.nguoiDung.create({
      data: {
        TenDangNhap: "bithu_tienganh",
        MatKhauHash: hashedPassword,
        VaiTro: "BI_THU",
        ToChucDangId: chiBoTiengAnh.Id,
        HoTen: "Bí thư Chi bộ Tiếng Anh",
        TrangThai: "ACTIVE",
      },
    });

    // Bí thư Chi bộ Tiếng Trung
    await prisma.nguoiDung.create({
      data: {
        TenDangNhap: "bithu_tiengtrung",
        MatKhauHash: hashedPassword,
        VaiTro: "BI_THU",
        ToChucDangId: chiBoTiengTrung.Id,
        HoTen: "Bí thư Chi bộ Tiếng Trung",
        TrangThai: "ACTIVE",
      },
    });

    // Bí thư Đảng bộ Khoa Trinh sát - Quân báo
    await prisma.nguoiDung.create({
      data: {
        TenDangNhap: "bithu_trinhsat",
        MatKhauHash: hashedPassword,
        VaiTro: "BI_THU",
        ToChucDangId: dangBoTrinhSat.Id,
        HoTen: "Bí thư Đảng bộ Khoa Trinh sát - Quân báo",
        TrangThai: "ACTIVE",
      },
    });

    // Bí thư Chi bộ Trinh sát Kỹ thuật
    await prisma.nguoiDung.create({
      data: {
        TenDangNhap: "bithu_tskt",
        MatKhauHash: hashedPassword,
        VaiTro: "BI_THU",
        ToChucDangId: chiBoTrinhSatKyThuat.Id,
        HoTen: "Bí thư Chi bộ Trinh sát Kỹ thuật",
        TrangThai: "ACTIVE",
      },
    });

    // Bí thư Chi bộ Quân báo
    await prisma.nguoiDung.create({
      data: {
        TenDangNhap: "bithu_quanbao",
        MatKhauHash: hashedPassword,
        VaiTro: "BI_THU",
        ToChucDangId: chiBoQuanBao.Id,
        HoTen: "Bí thư Chi bộ Quân báo",
        TrangThai: "ACTIVE",
      },
    });

    console.log(`  ✅ Đã tạo các tài khoản người dùng`);

    // 4. Định nghĩa danh sách 10 Đảng viên mẫu
    console.log("\n👥 Đang chuẩn bị danh sách 10 Đảng viên mẫu...");

    const membersData = [
      // 1. Nguyễn Minh Đức (Tiếng Anh) - Bí thư Chi bộ
      {
        SoLyLich: "LL-7102938",
        SoTheDangVien: "TĐV-1928374",
        TrangThai: "HOAT_DONG",
        toChucDangName: "Chi bộ Tiếng Anh",
        HoTenDangDung: "Nguyễn Minh Đức",
        HoTenKhaiSinh: "Nguyễn Minh Đức",
        GioiTinh: "Nam",
        NgaySinh: "1975-02-18",
        NoiSinh: "Bệnh viện Quân y 103, Hà Nội",
        QueQuan: "Xã Đông Hưng, Huyện Đông Sơn, Tỉnh Thanh Hóa",
        NoiThuongTru: "Số 45 Ngõ 128 Nguyễn Chí Thanh, Đống Đa, Hà Nội",
        NoiTamTru: "Nhà công vụ Học viện KHQS, Nam Từ Liêm, Hà Nội",
        DanToc: "Kinh",
        TonGiao: "Không",
        ThanhPhanGiaDinh: "Cán bộ Quân đội",
        NgheNghiepHienNay: "Giảng viên Đại học",
        NgheNghiepKhiVaoDang: "Học viên sĩ quan",
        NgayVaoDang: "1998-06-19",
        ChiBoVaoDang: "Chi bộ Học viên Đại đội 5, Khoa Ngoại ngữ",
        NguoiGioiThieu1: "Đại tá Trần Văn Hòa",
        ChucVuNGT1: "Nguyên Chủ nhiệm Khoa Ngoại ngữ",
        NguoiGioiThieu2: "Trung tá Phạm Thị Nga",
        ChucVuNGT2: "Giảng viên Bộ môn Tiếng Anh",
        NgayQuyetDinhKetNap: "1998-06-10",
        NgayChinhThuc: "1999-06-19",
        ChiBoChinhThuc: "Chi bộ Bộ môn Tiếng Anh",
        NoiSinhHoatDang: "Chi bộ Tiếng Anh",
        ChucVuDang: "Bí thư Chi bộ",
        NgayVaoDoan: "1991-03-26",
        ToChucXaHoi: "Hội Cựu chiến binh",
        GiaoDucPhoThong: "12/12",
        GiaoDucNgheNghiep: "Không",
        GiaoDucDaiHoc: "Học viện Khoa học Quân sự - Cử nhân Tiếng Anh",
        HocVi: "Tiến sĩ Ngôn ngữ học Anh",
        HocHam: "Phó Giáo sư",
        LyLuanChinhTri: "Cao cấp",
        NgoaiNgu: "Tiếng Anh (bản ngữ chuyên ngành), Tiếng Nga B2",
        TinHoc: "Thành thạo",
        NgayTuyenDung: "1993-09-05",
        CoQuanTuyenDung: "Học viện Khoa học Quân sự",
        NgayNhapNgu: "1993-09-05",
        CapBac: "Thượng tá",
        CongViecChinh: "Trưởng bộ môn Tiếng Anh, Khoa Ngoại ngữ",
        TinhTrangSucKhoe: "Tốt (Loại 1)",
        ThuongBinhLoai: "Không",
        GiaDinhLietSy: false,
        GiaDinhCoCong: true,
        SoCMND: "038075001234",
        SoCMTQD: "QĐ-0710293",
        KhenThuong:
          "Huân chương Chiến sĩ vẻ vang hạng Ba; Bằng khen Bộ trưởng Bộ Quốc phòng (2022)",
        HuyHieuDang: "Chưa",
        DanhHieuPhongTang: "Nhà giáo Ưu tú (2023)",
        KyLuat: "Không",
        LichSuBanThan: {
          bixoaten: "Không",
          ketNapLai: "Không",
          khoiPhucDangTich: "Không",
          xuLyPhapLuat: "Không",
          cheDocU: "Không",
        },
        QuanHeNuocNgoai: {
          foreignTravel:
            "Bồi dưỡng chuyên môn tại Học viện Ngôn ngữ Quốc phòng Hoa Kỳ (DLIFLC), 2016",
          foreignOrgs: "Không",
          foreignRelatives: "Không",
        },
        HoanCanhKinhTe: {
          totalIncome: "260.000.000đ/năm",
          perCapitaIncome: "65.000.000đ/năm",
          houseOwned: "Nhà riêng tự xây, diện tích 150m2",
          landOwned: "Không",
          economicActivity: "Giảng dạy, nghiên cứu khoa học",
          valuableAssets: "Không",
        },
        QuanHeGiaDinh: [
          {
            QuanHe: "Bố đẻ",
            HoTen: "Nguyễn Văn Bình",
            NamSinh: "1948",
            ThongTin: "Cựu chiến binh, đã mất",
          },
          {
            QuanHe: "Mẹ đẻ",
            HoTen: "Lê Thị Xuân",
            NamSinh: "1951",
            ThongTin: "Hưu trí, sinh sống tại Thanh Hóa",
          },
          {
            QuanHe: "Vợ",
            HoTen: "Đinh Thị Hải Yến",
            NamSinh: "1978",
            ThongTin: "Giáo viên THPT, Hà Nội",
          },
          {
            QuanHe: "Con trai",
            HoTen: "Nguyễn Minh Khôi",
            NamSinh: "2006",
            ThongTin: "Sinh viên Đại học Ngoại thương",
          },
        ],
        QuaTrinhCongTac: [
          {
            TuThangNam: "1993-09-01",
            DenThangNam: "1998-08-01",
            LamGiChucVuDonVi: "Học viên Đại đội 5, Tiểu đoàn 1, Học viện KHQS",
          },
          {
            TuThangNam: "1998-09-01",
            DenThangNam: "2008-08-01",
            LamGiChucVuDonVi: "Giảng viên Bộ môn Tiếng Anh, Khoa Ngoại ngữ",
          },
          {
            TuThangNam: "2008-09-01",
            DenThangNam: null,
            LamGiChucVuDonVi:
              "Trưởng bộ môn Tiếng Anh, Khoa Ngoại ngữ, Học viện KHQS",
          },
        ],
        QuaTrinhDaoTao: [
          {
            TenTruong: "Học viện Khoa học Quân sự",
            NganhHoc: "Tiếng Anh quân sự",
            TuNgay: "1993-09-01",
            DenNgay: "1998-07-31",
            HinhThuc: "Chính quy quân sự",
            VanBangCert: "Bằng Cử nhân",
          },
          {
            TenTruong: "Đại học Ngoại ngữ - ĐHQGHN",
            NganhHoc: "Ngôn ngữ học Anh",
            TuNgay: "2005-09-01",
            DenNgay: "2010-06-30",
            HinhThuc: "Bán tập trung",
            VanBangCert: "Bằng Tiến sĩ",
          },
        ],
        LichSuQuanHam: [
          {
            CapBac: "Đại úy",
            ChucVu: "Giảng viên",
            DonVi: "Học viện KHQS",
            NgayHieuLuc: "2003-08-01",
            SoQuyetDinh: "QĐ-215/BQP",
          },
          {
            CapBac: "Thiếu tá",
            ChucVu: "Giảng viên",
            DonVi: "Học viện KHQS",
            NgayHieuLuc: "2009-08-01",
            SoQuyetDinh: "QĐ-882/BQP",
          },
          {
            CapBac: "Trung tá",
            ChucVu: "Trưởng bộ môn",
            DonVi: "Học viện KHQS",
            NgayHieuLuc: "2014-08-01",
            SoQuyetDinh: "QĐ-1345/BQP",
          },
          {
            CapBac: "Thượng tá",
            ChucVu: "Trưởng bộ môn",
            DonVi: "Học viện KHQS",
            NgayHieuLuc: "2020-08-01",
            SoQuyetDinh: "QĐ-3021/BQP",
          },
        ],
        DanhGiaDangVien: [
          {
            Nam: 2023,
            XepLoai: "Xuất sắc",
            NhanXet:
              "Đồng chí lãnh đạo bộ môn hoàn thành xuất sắc nhiệm vụ giảng dạy và nghiên cứu khoa học.",
            TrangThai: "APPROVED",
          },
          {
            Nam: 2024,
            XepLoai: "Xuất sắc",
            NhanXet:
              "Hoàn thành xuất sắc nhiệm vụ, đạt danh hiệu Chiến sĩ thi đua cơ sở.",
            TrangThai: "APPROVED",
          },
          {
            Nam: 2025,
            XepLoai: "Tốt",
            NhanXet: "Nhất trí đề xuất Hoàn thành tốt nhiệm vụ năm 2025.",
            TrangThai: "DRAFT",
          },
        ],
      },
      // 2. Trần Thị Hương (Tiếng Anh)
      {
        SoLyLich: "LL-8203947",
        SoTheDangVien: "TĐV-2938475",
        TrangThai: "HOAT_DONG",
        toChucDangName: "Chi bộ Tiếng Anh",
        HoTenDangDung: "Trần Thị Hương",
        HoTenKhaiSinh: "Trần Thị Hương",
        GioiTinh: "Nữ",
        NgaySinh: "1985-09-03",
        NoiSinh: "Bệnh viện Phụ sản Trung ương, Hà Nội",
        QueQuan: "Phường Vĩnh Trại, Thành phố Lạng Sơn, Tỉnh Lạng Sơn",
        NoiThuongTru: "Số 21 ngõ 82 Trần Duy Hưng, Cầu Giấy, Hà Nội",
        NoiTamTru: "Số 21 ngõ 82 Trần Duy Hưng, Cầu Giấy, Hà Nội",
        DanToc: "Kinh",
        TonGiao: "Không",
        ThanhPhanGiaDinh: "Công chức",
        NgheNghiepHienNay: "Giảng viên chính",
        NgheNghiepKhiVaoDang: "Học viên sĩ quan",
        NgayVaoDang: "2009-05-19",
        ChiBoVaoDang: "Chi bộ Học viên Đại đội 5, Khoa Ngoại ngữ",
        NguoiGioiThieu1: "Thượng tá Nguyễn Minh Đức",
        ChucVuNGT1: "Trưởng bộ môn Tiếng Anh",
        NguoiGioiThieu2: "Thiếu tá Đinh Văn Long",
        ChucVuNGT2: "Giảng viên Bộ môn Tiếng Anh",
        NgayQuyetDinhKetNap: "2009-05-10",
        NgayChinhThuc: "2010-05-19",
        ChiBoChinhThuc: "Chi bộ Bộ môn Tiếng Anh",
        NoiSinhHoatDang: "Chi bộ Tiếng Anh",
        ChucVuDang: "Chi ủy viên",
        NgayVaoDoan: "2001-03-26",
        ToChucXaHoi: "Công đoàn Quốc phòng",
        GiaoDucPhoThong: "12/12",
        GiaoDucNgheNghiep: "Không",
        GiaoDucDaiHoc: "Học viện Khoa học Quân sự - Cử nhân Tiếng Anh",
        HocVi: "Thạc sĩ Phương pháp giảng dạy tiếng Anh",
        HocHam: "Không",
        LyLuanChinhTri: "Trung cấp",
        NgoaiNgu: "Tiếng Anh IELTS 8.0, Tiếng Pháp B1",
        TinHoc: "Thành thạo",
        NgayTuyenDung: "2004-09-05",
        CoQuanTuyenDung: "Học viện Khoa học Quân sự",
        NgayNhapNgu: "2004-09-05",
        CapBac: "Thiếu tá",
        CongViecChinh: "Giảng viên chính Bộ môn Tiếng Anh",
        TinhTrangSucKhoe: "Tốt (Loại 1)",
        ThuongBinhLoai: "Không",
        GiaDinhLietSy: false,
        GiaDinhCoCong: false,
        SoCMND: "025085001234",
        SoCMTQD: "QĐ-0820394",
        KhenThuong: "Chiến sĩ thi đua cơ sở (2022, 2024)",
        HuyHieuDang: "Chưa",
        DanhHieuPhongTang: "Không",
        KyLuat: "Không",
        QuanHeGiaDinh: [
          {
            QuanHe: "Bố đẻ",
            HoTen: "Trần Văn Kiên",
            NamSinh: "1958",
            ThongTin: "Hưu trí, sinh sống tại Lạng Sơn",
          },
          {
            QuanHe: "Mẹ đẻ",
            HoTen: "Hoàng Thị Sen",
            NamSinh: "1960",
            ThongTin: "Hưu trí, sinh sống tại Lạng Sơn",
          },
          {
            QuanHe: "Chồng",
            HoTen: "Đỗ Mạnh Cường",
            NamSinh: "1983",
            ThongTin: "Kỹ sư xây dựng, Hà Nội",
          },
          {
            QuanHe: "Con gái",
            HoTen: "Đỗ Trần Bảo Ngọc",
            NamSinh: "2015",
            ThongTin: "Học sinh Tiểu học",
          },
        ],
        QuaTrinhCongTac: [
          {
            TuThangNam: "2004-09-01",
            DenThangNam: "2009-08-01",
            LamGiChucVuDonVi: "Học viên Đại đội 5, Tiểu đoàn 1, Học viện KHQS",
          },
          {
            TuThangNam: "2009-09-01",
            DenThangNam: null,
            LamGiChucVuDonVi:
              "Giảng viên Bộ môn Tiếng Anh, Khoa Ngoại ngữ, Học viện KHQS",
          },
        ],
        QuaTrinhDaoTao: [
          {
            TenTruong: "Học viện Khoa học Quân sự",
            NganhHoc: "Tiếng Anh quân sự",
            TuNgay: "2004-09-01",
            DenNgay: "2009-07-31",
            HinhThuc: "Chính quy quân sự",
            VanBangCert: "Bằng Cử nhân",
          },
          {
            TenTruong: "Đại học Hà Nội",
            NganhHoc: "Phương pháp giảng dạy tiếng Anh",
            TuNgay: "2012-09-01",
            DenNgay: "2014-06-30",
            HinhThuc: "Tại chức",
            VanBangCert: "Bằng Thạc sĩ",
          },
        ],
        LichSuQuanHam: [
          {
            CapBac: "Trung úy",
            ChucVu: "Giảng viên",
            DonVi: "Học viện KHQS",
            NgayHieuLuc: "2009-08-01",
            SoQuyetDinh: "QĐ-664/BQP",
          },
          {
            CapBac: "Thượng úy",
            ChucVu: "Giảng viên",
            DonVi: "Học viện KHQS",
            NgayHieuLuc: "2013-08-01",
            SoQuyetDinh: "QĐ-1102/BQP",
          },
          {
            CapBac: "Đại úy",
            ChucVu: "Giảng viên",
            DonVi: "Học viện KHQS",
            NgayHieuLuc: "2017-08-01",
            SoQuyetDinh: "QĐ-1890/BQP",
          },
          {
            CapBac: "Thiếu tá",
            ChucVu: "Giảng viên chính",
            DonVi: "Học viện KHQS",
            NgayHieuLuc: "2022-08-01",
            SoQuyetDinh: "QĐ-2733/BQP",
          },
        ],
        DanhGiaDangVien: [
          {
            Nam: 2023,
            XepLoai: "Tốt",
            NhanXet:
              "Hoàn thành tốt nhiệm vụ giảng dạy, tích cực đổi mới phương pháp.",
            TrangThai: "APPROVED",
          },
          {
            Nam: 2024,
            XepLoai: "Xuất sắc",
            NhanXet:
              "Hoàn thành xuất sắc nhiệm vụ, đạt danh hiệu Chiến sĩ thi đua cơ sở.",
            TrangThai: "APPROVED",
          },
          {
            Nam: 2025,
            XepLoai: "Tốt",
            NhanXet: "Nhất trí đề xuất Hoàn thành tốt nhiệm vụ năm 2025.",
            TrangThai: "DRAFT",
          },
        ],
      },
      // 3. Lê Văn Phong (Tiếng Anh) - giảng viên trẻ
      {
        SoLyLich: "LL-9304857",
        SoTheDangVien: "TĐV-3849573",
        TrangThai: "HOAT_DONG",
        toChucDangName: "Chi bộ Tiếng Anh",
        HoTenDangDung: "Lê Văn Phong",
        HoTenKhaiSinh: "Lê Văn Phong",
        GioiTinh: "Nam",
        NgaySinh: "1998-01-27",
        NoiSinh: "Bệnh viện Đa khoa Tỉnh Nghệ An",
        QueQuan: "Xã Nghi Trường, Huyện Nghi Lộc, Tỉnh Nghệ An",
        NoiThuongTru: "Ký túc xá Giảng viên Học viện KHQS, Nam Từ Liêm, Hà Nội",
        NoiTamTru: "Ký túc xá Giảng viên Học viện KHQS, Nam Từ Liêm, Hà Nội",
        DanToc: "Kinh",
        TonGiao: "Không",
        ThanhPhanGiaDinh: "Nông dân",
        NgheNghiepHienNay: "Giảng viên tập sự",
        NgheNghiepKhiVaoDang: "Học viên sĩ quan",
        NgayVaoDang: "2022-06-05",
        ChiBoVaoDang: "Chi bộ Lớp học viên K54-NN, Tiểu đoàn 1",
        NguoiGioiThieu1: "Thiếu tá Trần Thị Hương",
        ChucVuNGT1: "Giảng viên chính Bộ môn Tiếng Anh",
        NguoiGioiThieu2: "Đại úy Nguyễn Văn Kiên",
        ChucVuNGT2: "Giảng viên Bộ môn Tiếng Anh",
        NgayQuyetDinhKetNap: "2022-05-25",
        NgayChinhThuc: "2023-06-05",
        ChiBoChinhThuc: "Chi bộ Tiếng Anh",
        NoiSinhHoatDang: "Chi bộ Tiếng Anh",
        ChucVuDang: "",
        NgayVaoDoan: "2015-03-26",
        ToChucXaHoi: "Không",
        GiaoDucPhoThong: "12/12",
        GiaoDucNgheNghiep: "Không",
        GiaoDucDaiHoc: "Học viện Khoa học Quân sự - Cử nhân Tiếng Anh xuất sắc",
        HocVi: "Đang học Thạc sĩ Ngôn ngữ Anh",
        HocHam: "Không",
        LyLuanChinhTri: "Sơ cấp",
        NgoaiNgu: "Tiếng Anh IELTS 8.5, Tiếng Trung HSK4",
        TinHoc: "Khá",
        NgayTuyenDung: "2018-09-05",
        CoQuanTuyenDung: "Học viện Khoa học Quân sự",
        NgayNhapNgu: "2018-09-05",
        CapBac: "Trung úy",
        CongViecChinh: "Giảng viên tập sự Bộ môn Tiếng Anh",
        TinhTrangSucKhoe: "Tốt (Loại 1)",
        ThuongBinhLoai: "Không",
        GiaDinhLietSy: false,
        GiaDinhCoCong: false,
        SoCMND: "038198001234",
        SoCMTQD: "QĐ-0930485",
        KhenThuong: "Bằng khen Giám đốc Học viện KHQS (2023)",
        HuyHieuDang: "Chưa",
        DanhHieuPhongTang: "Không",
        KyLuat: "Không",
        QuanHeGiaDinh: [
          {
            QuanHe: "Cha đẻ",
            HoTen: "Lê Văn Bốn",
            NamSinh: "1970",
            ThongTin: "Nông dân, sinh sống tại Nghệ An",
          },
          {
            QuanHe: "Mẹ đẻ",
            HoTen: "Nguyễn Thị Hạnh",
            NamSinh: "1973",
            ThongTin: "Nông dân, sinh sống tại Nghệ An",
          },
        ],
        QuaTrinhCongTac: [
          {
            TuThangNam: "2018-09-01",
            DenThangNam: "2023-07-30",
            LamGiChucVuDonVi: "Học viên Khoa Ngoại ngữ, Học viện KHQS",
          },
          {
            TuThangNam: "2023-08-01",
            DenThangNam: null,
            LamGiChucVuDonVi:
              "Giảng viên tập sự, Bộ môn Tiếng Anh, Khoa Ngoại ngữ",
          },
        ],
        QuaTrinhDaoTao: [
          {
            TenTruong: "Học viện Khoa học Quân sự",
            NganhHoc: "Tiếng Anh quân sự",
            TuNgay: "2018-09-01",
            DenNgay: "2023-07-30",
            HinhThuc: "Chính quy quân sự",
            VanBangCert: "Bằng Cử nhân xuất sắc",
          },
        ],
        LichSuQuanHam: [
          {
            CapBac: "Trung úy",
            ChucVu: "Giảng viên tập sự",
            DonVi: "Học viện KHQS",
            NgayHieuLuc: "2023-08-01",
            SoQuyetDinh: "QĐ-3012/TCHC",
          },
        ],
        DanhGiaDangVien: [
          {
            Nam: 2023,
            XepLoai: "Tốt",
            NhanXet:
              "Đồng chí trẻ, nhiệt huyết, hoàn thành tốt nhiệm vụ tập sự giảng dạy.",
            TrangThai: "APPROVED",
          },
          {
            Nam: 2024,
            XepLoai: "Tốt",
            NhanXet:
              "Hoàn thành tốt nhiệm vụ, tích cực học tập nâng cao trình độ.",
            TrangThai: "APPROVED",
          },
          {
            Nam: 2025,
            XepLoai: "Tốt",
            NhanXet: "Nhất trí xếp loại Hoàn thành tốt nhiệm vụ.",
            TrangThai: "DRAFT",
          },
        ],
      },
      // 4. Phạm Thị Lan Anh (Tiếng Trung)
      {
        SoLyLich: "LL-1029384",
        SoTheDangVien: "TĐV-4958602",
        TrangThai: "HOAT_DONG",
        toChucDangName: "Chi bộ Tiếng Trung",
        HoTenDangDung: "Phạm Thị Lan Anh",
        HoTenKhaiSinh: "Phạm Thị Lan Anh",
        GioiTinh: "Nữ",
        NgaySinh: "1980-04-11",
        NoiSinh: "Bệnh viện Đa khoa Tỉnh Bắc Giang",
        QueQuan: "Phường Trần Nguyên Hãn, Thành phố Bắc Giang, Tỉnh Bắc Giang",
        NoiThuongTru: "Số 68 Trần Thái Tông, Cầu Giấy, Hà Nội",
        NoiTamTru: "Số 68 Trần Thái Tông, Cầu Giấy, Hà Nội",
        DanToc: "Kinh",
        TonGiao: "Không",
        ThanhPhanGiaDinh: "Cán bộ Quân đội",
        NgheNghiepHienNay: "Giảng viên chính",
        NgheNghiepKhiVaoDang: "Học viên sĩ quan",
        NgayVaoDang: "2004-05-19",
        ChiBoVaoDang: "Chi bộ Học viên Đại đội 6, Khoa Ngoại ngữ",
        NguoiGioiThieu1: "Đại tá Đỗ Văn Thắng",
        ChucVuNGT1: "Nguyên Trưởng bộ môn Tiếng Trung",
        NguoiGioiThieu2: "Trung tá Vũ Thị Hiền",
        ChucVuNGT2: "Giảng viên Bộ môn Tiếng Trung",
        NgayQuyetDinhKetNap: "2004-05-10",
        NgayChinhThuc: "2005-05-19",
        ChiBoChinhThuc: "Chi bộ Bộ môn Tiếng Trung",
        NoiSinhHoatDang: "Chi bộ Tiếng Trung",
        ChucVuDang: "Chi ủy viên",
        NgayVaoDoan: "1996-03-26",
        ToChucXaHoi: "Hội Phụ nữ Quân đội",
        GiaoDucPhoThong: "12/12",
        GiaoDucNgheNghiep: "Không",
        GiaoDucDaiHoc: "Học viện Khoa học Quân sự - Cử nhân Tiếng Trung",
        HocVi: "Tiến sĩ Ngôn ngữ và Văn hóa Trung Quốc",
        HocHam: "Không",
        LyLuanChinhTri: "Cao cấp",
        NgoaiNgu: "Tiếng Trung HSK6, Tiếng Anh B2",
        TinHoc: "Thành thạo",
        NgayTuyenDung: "1999-09-05",
        CoQuanTuyenDung: "Học viện Khoa học Quân sự",
        NgayNhapNgu: "1999-09-05",
        CapBac: "Thiếu tá",
        CongViecChinh: "Giảng viên chính Bộ môn Tiếng Trung",
        TinhTrangSucKhoe: "Tốt (Loại 1)",
        ThuongBinhLoai: "Không",
        GiaDinhLietSy: false,
        GiaDinhCoCong: true,
        SoCMND: "024180001234",
        SoCMTQD: "QĐ-0102938",
        KhenThuong: "Bằng khen Bộ trưởng Bộ Quốc phòng (2021)",
        HuyHieuDang: "Chưa",
        DanhHieuPhongTang: "Không",
        KyLuat: "Không",
        QuanHeGiaDinh: [
          {
            QuanHe: "Chồng",
            HoTen: "Nguyễn Anh Dũng",
            NamSinh: "1978",
            ThongTin:
              "Sĩ quan Quân đội, Trung tá, công tác tại Bộ Tổng Tham mưu",
          },
          {
            QuanHe: "Con trai",
            HoTen: "Nguyễn Anh Khôi",
            NamSinh: "2010",
            ThongTin: "Học sinh THCS",
          },
        ],
        QuaTrinhCongTac: [
          {
            TuThangNam: "1999-09-01",
            DenThangNam: "2004-08-01",
            LamGiChucVuDonVi: "Học viên Đại đội 6, Tiểu đoàn 1, Học viện KHQS",
          },
          {
            TuThangNam: "2004-09-01",
            DenThangNam: null,
            LamGiChucVuDonVi:
              "Giảng viên Bộ môn Tiếng Trung, Khoa Ngoại ngữ, Học viện KHQS",
          },
        ],
        QuaTrinhDaoTao: [
          {
            TenTruong: "Học viện Khoa học Quân sự",
            NganhHoc: "Tiếng Trung quân sự",
            TuNgay: "1999-09-01",
            DenNgay: "2004-07-31",
            HinhThuc: "Chính quy quân sự",
            VanBangCert: "Bằng Cử nhân",
          },
          {
            TenTruong: "Đại học Ngôn ngữ Bắc Kinh (Trung Quốc)",
            NganhHoc: "Ngôn ngữ và Văn hóa Trung Quốc",
            TuNgay: "2011-09-01",
            DenNgay: "2015-06-30",
            HinhThuc: "Tập trung nước ngoài",
            VanBangCert: "Bằng Tiến sĩ",
          },
        ],
        LichSuQuanHam: [
          {
            CapBac: "Đại úy",
            ChucVu: "Giảng viên",
            DonVi: "Học viện KHQS",
            NgayHieuLuc: "2008-08-01",
            SoQuyetDinh: "QĐ-441/BQP",
          },
          {
            CapBac: "Thiếu tá",
            ChucVu: "Giảng viên chính",
            DonVi: "Học viện KHQS",
            NgayHieuLuc: "2016-08-01",
            SoQuyetDinh: "QĐ-1670/BQP",
          },
        ],
        DanhGiaDangVien: [
          {
            Nam: 2023,
            XepLoai: "Xuất sắc",
            NhanXet:
              "Hoàn thành xuất sắc nhiệm vụ giảng dạy và biên soạn giáo trình.",
            TrangThai: "APPROVED",
          },
          {
            Nam: 2024,
            XepLoai: "Tốt",
            NhanXet:
              "Hoàn thành tốt nhiệm vụ, tích cực bồi dưỡng giảng viên trẻ.",
            TrangThai: "APPROVED",
          },
          {
            Nam: 2025,
            XepLoai: "Tốt",
            NhanXet: "Nhất trí đề xuất Hoàn thành tốt nhiệm vụ.",
            TrangThai: "DRAFT",
          },
        ],
      },
      // 5. Vũ Đình Khoa (Tiếng Trung)
      {
        SoLyLich: "LL-2938475",
        SoTheDangVien: "TĐV-5069713",
        TrangThai: "HOAT_DONG",
        toChucDangName: "Chi bộ Tiếng Trung",
        HoTenDangDung: "Vũ Đình Khoa",
        HoTenKhaiSinh: "Vũ Đình Khoa",
        GioiTinh: "Nam",
        NgaySinh: "1990-07-30",
        NoiSinh: "Bệnh viện Quân y 103, Hà Nội",
        QueQuan: "Xã Hồng Vân, Huyện Thường Tín, Hà Nội",
        NoiThuongTru: "Số 9 ngõ 15 Phùng Khoang, Nam Từ Liêm, Hà Nội",
        NoiTamTru: "Số 9 ngõ 15 Phùng Khoang, Nam Từ Liêm, Hà Nội",
        DanToc: "Kinh",
        TonGiao: "Không",
        ThanhPhanGiaDinh: "Công nhân",
        NgheNghiepHienNay: "Giảng viên",
        NgheNghiepKhiVaoDang: "Học viên sĩ quan",
        NgayVaoDang: "2013-06-15",
        ChiBoVaoDang: "Chi bộ Học viên Đại đội 6, Khoa Ngoại ngữ",
        NguoiGioiThieu1: "Thiếu tá Phạm Thị Lan Anh",
        ChucVuNGT1: "Giảng viên chính Bộ môn Tiếng Trung",
        NguoiGioiThieu2: "Đại úy Ngô Văn Kiên",
        ChucVuNGT2: "Giảng viên Bộ môn Tiếng Trung",
        NgayQuyetDinhKetNap: "2013-06-05",
        NgayChinhThuc: "2014-06-15",
        ChiBoChinhThuc: "Chi bộ Tiếng Trung",
        NoiSinhHoatDang: "Chi bộ Tiếng Trung",
        ChucVuDang: "",
        NgayVaoDoan: "2005-03-26",
        ToChucXaHoi: "Không",
        GiaoDucPhoThong: "12/12",
        GiaoDucNgheNghiep: "Không",
        GiaoDucDaiHoc: "Học viện Khoa học Quân sự - Cử nhân Tiếng Trung",
        HocVi: "Thạc sĩ Ngôn ngữ Trung Quốc",
        HocHam: "Không",
        LyLuanChinhTri: "Trung cấp",
        NgoaiNgu: "Tiếng Trung HSK5, Tiếng Anh B1",
        TinHoc: "Khá",
        NgayTuyenDung: "2008-09-05",
        CoQuanTuyenDung: "Học viện Khoa học Quân sự",
        NgayNhapNgu: "2008-09-05",
        CapBac: "Đại úy",
        CongViecChinh: "Giảng viên Bộ môn Tiếng Trung",
        TinhTrangSucKhoe: "Tốt (Loại 1)",
        ThuongBinhLoai: "Không",
        GiaDinhLietSy: false,
        GiaDinhCoCong: false,
        SoCMND: "001190001234",
        SoCMTQD: "QĐ-0293847",
        KhenThuong: "Chiến sĩ tiên tiến (2023, 2024)",
        HuyHieuDang: "Chưa",
        DanhHieuPhongTang: "Không",
        KyLuat: "Không",
        QuanHeGiaDinh: [
          {
            QuanHe: "Bố đẻ",
            HoTen: "Vũ Đình Toàn",
            NamSinh: "1962",
            ThongTin: "Công nhân về hưu, Thường Tín, Hà Nội",
          },
          {
            QuanHe: "Vợ",
            HoTen: "Nguyễn Thị Kim Oanh",
            NamSinh: "1992",
            ThongTin: "Nhân viên văn phòng, Hà Nội",
          },
        ],
        QuaTrinhCongTac: [
          {
            TuThangNam: "2008-09-01",
            DenThangNam: "2013-08-01",
            LamGiChucVuDonVi: "Học viên Đại đội 6, Tiểu đoàn 1, Học viện KHQS",
          },
          {
            TuThangNam: "2013-09-01",
            DenThangNam: null,
            LamGiChucVuDonVi:
              "Giảng viên Bộ môn Tiếng Trung, Khoa Ngoại ngữ, Học viện KHQS",
          },
        ],
        QuaTrinhDaoTao: [
          {
            TenTruong: "Học viện Khoa học Quân sự",
            NganhHoc: "Tiếng Trung quân sự",
            TuNgay: "2008-09-01",
            DenNgay: "2013-07-31",
            HinhThuc: "Chính quy quân sự",
            VanBangCert: "Bằng Cử nhân",
          },
          {
            TenTruong: "Đại học Hà Nội",
            NganhHoc: "Ngôn ngữ Trung Quốc",
            TuNgay: "2016-09-01",
            DenNgay: "2018-06-30",
            HinhThuc: "Tại chức",
            VanBangCert: "Bằng Thạc sĩ",
          },
        ],
        LichSuQuanHam: [
          {
            CapBac: "Trung úy",
            ChucVu: "Giảng viên",
            DonVi: "Học viện KHQS",
            NgayHieuLuc: "2013-08-01",
            SoQuyetDinh: "QĐ-778/BQP",
          },
          {
            CapBac: "Thượng úy",
            ChucVu: "Giảng viên",
            DonVi: "Học viện KHQS",
            NgayHieuLuc: "2017-08-01",
            SoQuyetDinh: "QĐ-1439/BQP",
          },
          {
            CapBac: "Đại úy",
            ChucVu: "Giảng viên",
            DonVi: "Học viện KHQS",
            NgayHieuLuc: "2021-08-01",
            SoQuyetDinh: "QĐ-2255/BQP",
          },
        ],
        DanhGiaDangVien: [
          {
            Nam: 2023,
            XepLoai: "Tốt",
            NhanXet:
              "Hoàn thành tốt nhiệm vụ giảng dạy, tích cực tham gia hoạt động phong trào.",
            TrangThai: "APPROVED",
          },
          {
            Nam: 2024,
            XepLoai: "Tốt",
            NhanXet: "Hoàn thành tốt mọi nhiệm vụ được giao.",
            TrangThai: "APPROVED",
          },
          {
            Nam: 2025,
            XepLoai: "Tốt",
            NhanXet: "Nhất trí xếp loại Hoàn thành tốt nhiệm vụ.",
            TrangThai: "DRAFT",
          },
        ],
      },
      // 6. Hoàng Văn Sơn (Trinh sát Kỹ thuật) - Bí thư Chi bộ
      {
        SoLyLich: "LL-3049586",
        SoTheDangVien: "TĐV-6170824",
        TrangThai: "HOAT_DONG",
        toChucDangName: "Chi bộ Trinh sát Kỹ thuật",
        HoTenDangDung: "Hoàng Văn Sơn",
        HoTenKhaiSinh: "Hoàng Văn Sơn",
        GioiTinh: "Nam",
        NgaySinh: "1972-11-09",
        NoiSinh: "Bệnh viện Quân y 108, Hà Nội",
        QueQuan: "Xã Yên Sở, Huyện Hoài Đức, Hà Nội",
        NoiThuongTru: "Số 30 ngõ 78 Đường Láng, Đống Đa, Hà Nội",
        NoiTamTru: "Nhà công vụ Học viện KHQS, Nam Từ Liêm, Hà Nội",
        DanToc: "Kinh",
        TonGiao: "Không",
        ThanhPhanGiaDinh: "Cán bộ Quân đội",
        NgheNghiepHienNay: "Giảng viên Đại học",
        NgheNghiepKhiVaoDang: "Học viên sĩ quan",
        NgayVaoDang: "1996-05-19",
        ChiBoVaoDang: "Chi bộ Học viên Đại đội 8, Khoa Trinh sát",
        NguoiGioiThieu1: "Đại tá Lê Quốc Hùng",
        ChucVuNGT1: "Nguyên Chủ nhiệm Khoa Trinh sát",
        NguoiGioiThieu2: "Trung tá Đặng Văn Tùng",
        ChucVuNGT2: "Giảng viên Bộ môn Trinh sát Kỹ thuật",
        NgayQuyetDinhKetNap: "1996-05-10",
        NgayChinhThuc: "1997-05-19",
        ChiBoChinhThuc: "Chi bộ Bộ môn Trinh sát Kỹ thuật",
        NoiSinhHoatDang: "Chi bộ Trinh sát Kỹ thuật",
        ChucVuDang: "Bí thư Chi bộ",
        NgayVaoDoan: "1989-03-26",
        ToChucXaHoi: "Hội Cựu chiến binh",
        GiaoDucPhoThong: "12/12",
        GiaoDucNgheNghiep: "Không",
        GiaoDucDaiHoc: "Học viện Khoa học Quân sự - Kỹ sư Trinh sát Kỹ thuật",
        HocVi: "Tiến sĩ Kỹ thuật Quân sự",
        HocHam: "Phó Giáo sư",
        LyLuanChinhTri: "Cao cấp",
        NgoaiNgu: "Tiếng Nga C1, Tiếng Anh B2",
        TinHoc: "Chuyên sâu",
        NgayTuyenDung: "1991-09-05",
        CoQuanTuyenDung: "Học viện Khoa học Quân sự",
        NgayNhapNgu: "1991-09-05",
        CapBac: "Thượng tá",
        CongViecChinh: "Trưởng bộ môn Trinh sát Kỹ thuật",
        TinhTrangSucKhoe: "Tốt (Loại 1)",
        ThuongBinhLoai: "Không",
        GiaDinhLietSy: false,
        GiaDinhCoCong: true,
        SoCMND: "001072001234",
        SoCMTQD: "QĐ-0304958",
        KhenThuong: "Huân chương Chiến sĩ vẻ vang hạng Nhất, Nhì, Ba",
        HuyHieuDang: "Chưa",
        DanhHieuPhongTang: "Nhà giáo Ưu tú (2022)",
        KyLuat: "Không",
        QuanHeGiaDinh: [
          {
            QuanHe: "Vợ",
            HoTen: "Đặng Thị Kim Loan",
            NamSinh: "1975",
            ThongTin: "Giáo viên, đã nghỉ hưu",
          },
          {
            QuanHe: "Con trai",
            HoTen: "Hoàng Việt Anh",
            NamSinh: "2000",
            ThongTin: "Sĩ quan Quân đội, công tác tại Hà Nội",
          },
        ],
        QuaTrinhCongTac: [
          {
            TuThangNam: "1991-09-01",
            DenThangNam: "1996-08-01",
            LamGiChucVuDonVi: "Học viên Khoa Trinh sát, Học viện KHQS",
          },
          {
            TuThangNam: "1996-09-01",
            DenThangNam: "2010-09-30",
            LamGiChucVuDonVi: "Giảng viên Bộ môn Trinh sát Kỹ thuật",
          },
          {
            TuThangNam: "2010-10-01",
            DenThangNam: null,
            LamGiChucVuDonVi:
              "Trưởng bộ môn Trinh sát Kỹ thuật, Khoa Trinh sát - Quân báo",
          },
        ],
        QuaTrinhDaoTao: [
          {
            TenTruong: "Học viện Khoa học Quân sự",
            NganhHoc: "Trinh sát Kỹ thuật",
            TuNgay: "1991-09-01",
            DenNgay: "1996-07-31",
            HinhThuc: "Chính quy quân sự",
            VanBangCert: "Bằng Kỹ sư",
          },
          {
            TenTruong: "Học viện Kỹ thuật Quân sự",
            NganhHoc: "Kỹ thuật Điện tử Viễn thông",
            TuNgay: "2002-09-01",
            DenNgay: "2007-08-30",
            HinhThuc: "Bán tập trung",
            VanBangCert: "Bằng Tiến sĩ",
          },
        ],
        LichSuQuanHam: [
          {
            CapBac: "Thiếu tá",
            ChucVu: "Giảng viên",
            DonVi: "Học viện KHQS",
            NgayHieuLuc: "2005-08-01",
            SoQuyetDinh: "QĐ-556/BQP",
          },
          {
            CapBac: "Trung tá",
            ChucVu: "Trưởng bộ môn",
            DonVi: "Học viện KHQS",
            NgayHieuLuc: "2012-08-01",
            SoQuyetDinh: "QĐ-1189/BQP",
          },
          {
            CapBac: "Thượng tá",
            ChucVu: "Trưởng bộ môn",
            DonVi: "Học viện KHQS",
            NgayHieuLuc: "2019-08-01",
            SoQuyetDinh: "QĐ-2814/BQP",
          },
        ],
        DanhGiaDangVien: [
          {
            Nam: 2023,
            XepLoai: "Xuất sắc",
            NhanXet:
              "Đồng chí lãnh đạo bộ môn hoàn thành xuất sắc nhiệm vụ đào tạo và nghiên cứu khoa học quân sự.",
            TrangThai: "APPROVED",
          },
          {
            Nam: 2024,
            XepLoai: "Xuất sắc",
            NhanXet:
              "Hoàn thành xuất sắc nhiệm vụ, có nhiều đề tài khoa học cấp Bộ Quốc phòng.",
            TrangThai: "APPROVED",
          },
          {
            Nam: 2025,
            XepLoai: "Tốt",
            NhanXet: "Nhất trí đề xuất Hoàn thành tốt nhiệm vụ năm 2025.",
            TrangThai: "DRAFT",
          },
        ],
      },
      // 7. Đặng Thị Thu Trang (Trinh sát Kỹ thuật)
      {
        SoLyLich: "LL-4150697",
        SoTheDangVien: "TĐV-7281935",
        TrangThai: "HOAT_DONG",
        toChucDangName: "Chi bộ Trinh sát Kỹ thuật",
        HoTenDangDung: "Đặng Thị Thu Trang",
        HoTenKhaiSinh: "Đặng Thị Thu Trang",
        GioiTinh: "Nữ",
        NgaySinh: "1988-02-14",
        NoiSinh: "Bệnh viện Đa khoa Tỉnh Vĩnh Phúc",
        QueQuan: "Phường Liên Bảo, Thành phố Vĩnh Yên, Tỉnh Vĩnh Phúc",
        NoiThuongTru: "Số 5 ngõ 40 Trần Cung, Bắc Từ Liêm, Hà Nội",
        NoiTamTru: "Số 5 ngõ 40 Trần Cung, Bắc Từ Liêm, Hà Nội",
        DanToc: "Kinh",
        TonGiao: "Không",
        ThanhPhanGiaDinh: "Công chức",
        NgheNghiepHienNay: "Giảng viên",
        NgheNghiepKhiVaoDang: "Học viên sĩ quan",
        NgayVaoDang: "2011-06-15",
        ChiBoVaoDang: "Chi bộ Học viên Đại đội 8, Khoa Trinh sát",
        NguoiGioiThieu1: "Thượng tá Hoàng Văn Sơn",
        ChucVuNGT1: "Trưởng bộ môn Trinh sát Kỹ thuật",
        NguoiGioiThieu2: "Thiếu tá Ngô Thị Bích",
        ChucVuNGT2: "Giảng viên Bộ môn Trinh sát Kỹ thuật",
        NgayQuyetDinhKetNap: "2011-06-05",
        NgayChinhThuc: "2012-06-15",
        ChiBoChinhThuc: "Chi bộ Trinh sát Kỹ thuật",
        NoiSinhHoatDang: "Chi bộ Trinh sát Kỹ thuật",
        ChucVuDang: "",
        NgayVaoDoan: "2003-03-26",
        ToChucXaHoi: "Hội Phụ nữ Quân đội",
        GiaoDucPhoThong: "12/12",
        GiaoDucNgheNghiep: "Không",
        GiaoDucDaiHoc: "Học viện Khoa học Quân sự - Kỹ sư Trinh sát Kỹ thuật",
        HocVi: "Thạc sĩ Kỹ thuật Điện tử",
        HocHam: "Không",
        LyLuanChinhTri: "Trung cấp",
        NgoaiNgu: "Tiếng Anh B2, Tiếng Nga B1",
        TinHoc: "Thành thạo",
        NgayTuyenDung: "2006-09-05",
        CoQuanTuyenDung: "Học viện Khoa học Quân sự",
        NgayNhapNgu: "2006-09-05",
        CapBac: "Thiếu tá",
        CongViecChinh: "Giảng viên Bộ môn Trinh sát Kỹ thuật",
        TinhTrangSucKhoe: "Tốt (Loại 1)",
        ThuongBinhLoai: "Không",
        GiaDinhLietSy: false,
        GiaDinhCoCong: false,
        SoCMND: "026188001234",
        SoCMTQD: "QĐ-0415069",
        KhenThuong: "Chiến sĩ tiên tiến (2022, 2023, 2024)",
        HuyHieuDang: "Chưa",
        DanhHieuPhongTang: "Không",
        KyLuat: "Không",
        QuanHeGiaDinh: [
          {
            QuanHe: "Bố đẻ",
            HoTen: "Đặng Văn Quyết",
            NamSinh: "1960",
            ThongTin: "Cán bộ nghỉ hưu, Vĩnh Phúc",
          },
          {
            QuanHe: "Chồng",
            HoTen: "Lê Tuấn Anh",
            NamSinh: "1986",
            ThongTin: "Sĩ quan Quân đội, Đại úy, công tác tại Hà Nội",
          },
          {
            QuanHe: "Con trai",
            HoTen: "Lê Đặng Gia Bảo",
            NamSinh: "2016",
            ThongTin: "Học sinh Tiểu học",
          },
        ],
        QuaTrinhCongTac: [
          {
            TuThangNam: "2006-09-01",
            DenThangNam: "2011-08-01",
            LamGiChucVuDonVi: "Học viên Đại đội 8, Tiểu đoàn 2, Học viện KHQS",
          },
          {
            TuThangNam: "2011-09-01",
            DenThangNam: null,
            LamGiChucVuDonVi:
              "Giảng viên Bộ môn Trinh sát Kỹ thuật, Khoa Trinh sát - Quân báo",
          },
        ],
        QuaTrinhDaoTao: [
          {
            TenTruong: "Học viện Khoa học Quân sự",
            NganhHoc: "Trinh sát Kỹ thuật",
            TuNgay: "2006-09-01",
            DenNgay: "2011-07-31",
            HinhThuc: "Chính quy quân sự",
            VanBangCert: "Bằng Kỹ sư",
          },
          {
            TenTruong: "Học viện Kỹ thuật Quân sự",
            NganhHoc: "Kỹ thuật Điện tử",
            TuNgay: "2014-09-01",
            DenNgay: "2016-08-30",
            HinhThuc: "Tại chức",
            VanBangCert: "Bằng Thạc sĩ",
          },
        ],
        LichSuQuanHam: [
          {
            CapBac: "Trung úy",
            ChucVu: "Giảng viên",
            DonVi: "Học viện KHQS",
            NgayHieuLuc: "2011-08-01",
            SoQuyetDinh: "QĐ-990/BQP",
          },
          {
            CapBac: "Đại úy",
            ChucVu: "Giảng viên",
            DonVi: "Học viện KHQS",
            NgayHieuLuc: "2016-08-01",
            SoQuyetDinh: "QĐ-1876/BQP",
          },
          {
            CapBac: "Thiếu tá",
            ChucVu: "Giảng viên",
            DonVi: "Học viện KHQS",
            NgayHieuLuc: "2021-08-01",
            SoQuyetDinh: "QĐ-2660/BQP",
          },
        ],
        DanhGiaDangVien: [
          {
            Nam: 2023,
            XepLoai: "Tốt",
            NhanXet:
              "Hoàn thành tốt nhiệm vụ giảng dạy và huấn luyện thực hành.",
            TrangThai: "APPROVED",
          },
          {
            Nam: 2024,
            XepLoai: "Tốt",
            NhanXet: "Hoàn thành tốt mọi nhiệm vụ được giao.",
            TrangThai: "APPROVED",
          },
          {
            Nam: 2025,
            XepLoai: "Tốt",
            NhanXet: "Nhất trí xếp loại Hoàn thành tốt nhiệm vụ.",
            TrangThai: "DRAFT",
          },
        ],
      },
      // 8. Ngô Quang Huy (Trinh sát Kỹ thuật) - giảng viên trẻ
      {
        SoLyLich: "LL-5261708",
        SoTheDangVien: "TĐV-8392046",
        TrangThai: "HOAT_DONG",
        toChucDangName: "Chi bộ Trinh sát Kỹ thuật",
        HoTenDangDung: "Ngô Quang Huy",
        HoTenKhaiSinh: "Ngô Quang Huy",
        GioiTinh: "Nam",
        NgaySinh: "1999-08-20",
        NoiSinh: "Bệnh viện Đa khoa Tỉnh Hải Dương",
        QueQuan: "Phường Cẩm Thượng, Thành phố Hải Dương, Tỉnh Hải Dương",
        NoiThuongTru: "Ký túc xá Giảng viên Học viện KHQS, Nam Từ Liêm, Hà Nội",
        NoiTamTru: "Ký túc xá Giảng viên Học viện KHQS, Nam Từ Liêm, Hà Nội",
        DanToc: "Kinh",
        TonGiao: "Không",
        ThanhPhanGiaDinh: "Công nhân",
        NgheNghiepHienNay: "Giảng viên tập sự",
        NgheNghiepKhiVaoDang: "Học viên sĩ quan",
        NgayVaoDang: "2023-06-05",
        ChiBoVaoDang: "Chi bộ Lớp học viên K55-TS, Tiểu đoàn 2",
        NguoiGioiThieu1: "Thiếu tá Đặng Thị Thu Trang",
        ChucVuNGT1: "Giảng viên Bộ môn Trinh sát Kỹ thuật",
        NguoiGioiThieu2: "Đại úy Vũ Minh Đạt",
        ChucVuNGT2: "Giảng viên Bộ môn Trinh sát Kỹ thuật",
        NgayQuyetDinhKetNap: "2023-05-25",
        NgayChinhThuc: "2024-06-05",
        ChiBoChinhThuc: "Chi bộ Trinh sát Kỹ thuật",
        NoiSinhHoatDang: "Chi bộ Trinh sát Kỹ thuật",
        ChucVuDang: "",
        NgayVaoDoan: "2016-03-26",
        ToChucXaHoi: "Không",
        GiaoDucPhoThong: "12/12",
        GiaoDucNgheNghiep: "Không",
        GiaoDucDaiHoc:
          "Học viện Khoa học Quân sự - Kỹ sư Trinh sát Kỹ thuật xuất sắc",
        HocVi: "Kỹ sư",
        HocHam: "Không",
        LyLuanChinhTri: "Sơ cấp",
        NgoaiNgu: "Tiếng Anh B1",
        TinHoc: "Khá",
        NgayTuyenDung: "2019-09-05",
        CoQuanTuyenDung: "Học viện Khoa học Quân sự",
        NgayNhapNgu: "2019-09-05",
        CapBac: "Trung úy",
        CongViecChinh: "Giảng viên tập sự Bộ môn Trinh sát Kỹ thuật",
        TinhTrangSucKhoe: "Tốt (Loại 1)",
        ThuongBinhLoai: "Không",
        GiaDinhLietSy: false,
        GiaDinhCoCong: false,
        SoCMND: "030199001234",
        SoCMTQD: "QĐ-0526170",
        KhenThuong: "Chưa",
        HuyHieuDang: "Chưa",
        DanhHieuPhongTang: "Không",
        KyLuat: "Không",
        QuanHeGiaDinh: [
          {
            QuanHe: "Bố đẻ",
            HoTen: "Ngô Quang Vinh",
            NamSinh: "1971",
            ThongTin: "Công nhân, Hải Dương",
          },
          {
            QuanHe: "Mẹ đẻ",
            HoTen: "Phạm Thị Nhàn",
            NamSinh: "1974",
            ThongTin: "Công nhân, Hải Dương",
          },
        ],
        QuaTrinhCongTac: [
          {
            TuThangNam: "2019-09-01",
            DenThangNam: "2024-07-30",
            LamGiChucVuDonVi:
              "Học viên Khoa Trinh sát - Quân báo, Học viện KHQS",
          },
          {
            TuThangNam: "2024-08-01",
            DenThangNam: null,
            LamGiChucVuDonVi: "Giảng viên tập sự, Bộ môn Trinh sát Kỹ thuật",
          },
        ],
        QuaTrinhDaoTao: [
          {
            TenTruong: "Học viện Khoa học Quân sự",
            NganhHoc: "Trinh sát Kỹ thuật",
            TuNgay: "2019-09-01",
            DenNgay: "2024-07-30",
            HinhThuc: "Chính quy quân sự",
            VanBangCert: "Bằng Kỹ sư xuất sắc",
          },
        ],
        LichSuQuanHam: [
          {
            CapBac: "Trung úy",
            ChucVu: "Giảng viên tập sự",
            DonVi: "Học viện KHQS",
            NgayHieuLuc: "2024-08-01",
            SoQuyetDinh: "QĐ-3350/TCHC",
          },
        ],
        DanhGiaDangVien: [
          {
            Nam: 2024,
            XepLoai: "Tốt",
            NhanXet:
              "Đồng chí trẻ, có ý thức tổ chức kỷ luật tốt, tích cực học hỏi.",
            TrangThai: "APPROVED",
          },
          {
            Nam: 2025,
            XepLoai: "Tốt",
            NhanXet: "Nhất trí xếp loại Hoàn thành tốt nhiệm vụ.",
            TrangThai: "DRAFT",
          },
        ],
      },
      // 9. Bùi Xuân Trường (Quân báo) - Bí thư Chi bộ
      {
        SoLyLich: "LL-6372819",
        SoTheDangVien: "TĐV-9403157",
        TrangThai: "HOAT_DONG",
        toChucDangName: "Chi bộ Quân báo",
        HoTenDangDung: "Bùi Xuân Trường",
        HoTenKhaiSinh: "Bùi Xuân Trường",
        GioiTinh: "Nam",
        NgaySinh: "1968-05-01",
        NoiSinh: "Bệnh viện Quân y 103, Hà Nội",
        QueQuan: "Xã Cổ Loa, Huyện Đông Anh, Hà Nội",
        NoiThuongTru: "Số 55 phố Chùa Láng, Đống Đa, Hà Nội",
        NoiTamTru: "Số 55 phố Chùa Láng, Đống Đa, Hà Nội",
        DanToc: "Kinh",
        TonGiao: "Không",
        ThanhPhanGiaDinh: "Cán bộ Quân đội",
        NgheNghiepHienNay: "Giảng viên Đại học",
        NgheNghiepKhiVaoDang: "Học viên sĩ quan",
        NgayVaoDang: "1992-05-19",
        ChiBoVaoDang: "Chi bộ Học viên Đại đội 10, Khoa Quân báo",
        NguoiGioiThieu1: "Đại tá Nguyễn Xuân Thành",
        ChucVuNGT1: "Nguyên Chủ nhiệm Khoa Quân báo",
        NguoiGioiThieu2: "Trung tá Trịnh Văn Đạo",
        ChucVuNGT2: "Giảng viên Bộ môn Quân báo",
        NgayQuyetDinhKetNap: "1992-05-10",
        NgayChinhThuc: "1993-05-19",
        ChiBoChinhThuc: "Chi bộ Bộ môn Quân báo",
        NoiSinhHoatDang: "Chi bộ Quân báo",
        ChucVuDang: "Bí thư Chi bộ",
        NgayVaoDoan: "1985-03-26",
        ToChucXaHoi: "Hội Cựu chiến binh",
        GiaoDucPhoThong: "12/12",
        GiaoDucNgheNghiep: "Không",
        GiaoDucDaiHoc: "Học viện Khoa học Quân sự - Kỹ sư Quân báo",
        HocVi: "Tiến sĩ Khoa học Quân sự",
        HocHam: "Giáo sư",
        LyLuanChinhTri: "Cao cấp",
        NgoaiNgu: "Tiếng Anh C1, Tiếng Nga C1",
        TinHoc: "Chuyên gia",
        NgayTuyenDung: "1987-09-05",
        CoQuanTuyenDung: "Học viện Khoa học Quân sự",
        NgayNhapNgu: "1987-09-05",
        CapBac: "Đại tá",
        CongViecChinh: "Trưởng bộ môn Quân báo",
        TinhTrangSucKhoe: "Tốt (Loại 1)",
        ThuongBinhLoai: "Không",
        GiaDinhLietSy: false,
        GiaDinhCoCong: true,
        SoCMND: "001068001234",
        SoCMTQD: "QĐ-0637281",
        KhenThuong:
          "Huân chương Chiến sĩ vẻ vang hạng Nhất, Nhì, Ba; Bằng khen Thủ tướng Chính phủ (2020)",
        HuyHieuDang: "Chưa",
        DanhHieuPhongTang: "Nhà giáo Nhân dân (2021)",
        KyLuat: "Không",
        QuanHeGiaDinh: [
          {
            QuanHe: "Vợ",
            HoTen: "Nguyễn Thị Bích Hằng",
            NamSinh: "1970",
            ThongTin: "Cán bộ hưu trí, Hà Nội",
          },
          {
            QuanHe: "Con trai",
            HoTen: "Bùi Xuân Bách",
            NamSinh: "1995",
            ThongTin: "Sĩ quan Quân đội, công tác tại Bộ Quốc phòng",
          },
          {
            QuanHe: "Con gái",
            HoTen: "Bùi Thị Ngọc Diệp",
            NamSinh: "1999",
            ThongTin: "Giảng viên Đại học Ngoại thương",
          },
        ],
        QuaTrinhCongTac: [
          {
            TuThangNam: "1987-09-01",
            DenThangNam: "1992-08-01",
            LamGiChucVuDonVi: "Học viên Khoa Quân báo, Học viện KHQS",
          },
          {
            TuThangNam: "1992-09-01",
            DenThangNam: "2005-09-30",
            LamGiChucVuDonVi: "Giảng viên Bộ môn Quân báo",
          },
          {
            TuThangNam: "2005-10-01",
            DenThangNam: null,
            LamGiChucVuDonVi:
              "Trưởng bộ môn Quân báo, Khoa Trinh sát - Quân báo",
          },
        ],
        QuaTrinhDaoTao: [
          {
            TenTruong: "Học viện Khoa học Quân sự",
            NganhHoc: "Quân báo",
            TuNgay: "1987-09-01",
            DenNgay: "1992-07-31",
            HinhThuc: "Chính quy quân sự",
            VanBangCert: "Bằng Kỹ sư",
          },
          {
            TenTruong: "Học viện Quốc phòng",
            NganhHoc: "Khoa học Quân sự",
            TuNgay: "1998-09-01",
            DenNgay: "2003-08-30",
            HinhThuc: "Bán tập trung",
            VanBangCert: "Bằng Tiến sĩ",
          },
        ],
        LichSuQuanHam: [
          {
            CapBac: "Trung tá",
            ChucVu: "Trưởng bộ môn",
            DonVi: "Học viện KHQS",
            NgayHieuLuc: "2006-08-01",
            SoQuyetDinh: "QĐ-772/BQP",
          },
          {
            CapBac: "Thượng tá",
            ChucVu: "Trưởng bộ môn",
            DonVi: "Học viện KHQS",
            NgayHieuLuc: "2013-08-01",
            SoQuyetDinh: "QĐ-1541/BQP",
          },
          {
            CapBac: "Đại tá",
            ChucVu: "Trưởng bộ môn",
            DonVi: "Học viện KHQS",
            NgayHieuLuc: "2019-08-01",
            SoQuyetDinh: "QĐ-2903/BQP",
          },
        ],
        DanhGiaDangVien: [
          {
            Nam: 2023,
            XepLoai: "Xuất sắc",
            NhanXet:
              "Đồng chí gương mẫu, lãnh đạo bộ môn hoàn thành xuất sắc mọi nhiệm vụ đào tạo, nghiên cứu.",
            TrangThai: "APPROVED",
          },
          {
            Nam: 2024,
            XepLoai: "Xuất sắc",
            NhanXet:
              "Hoàn thành xuất sắc nhiệm vụ, chủ trì nhiều đề tài khoa học cấp Nhà nước.",
            TrangThai: "APPROVED",
          },
          {
            Nam: 2025,
            XepLoai: "Tốt",
            NhanXet: "Nhất trí đề xuất Hoàn thành tốt nhiệm vụ năm 2025.",
            TrangThai: "DRAFT",
          },
        ],
      },
      // 10. Đỗ Thị Kim Ngân (Quân báo)
      {
        SoLyLich: "LL-7483920",
        SoTheDangVien: "TĐV-0514268",
        TrangThai: "HOAT_DONG",
        toChucDangName: "Chi bộ Quân báo",
        HoTenDangDung: "Đỗ Thị Kim Ngân",
        HoTenKhaiSinh: "Đỗ Thị Kim Ngân",
        GioiTinh: "Nữ",
        NgaySinh: "1984-10-16",
        NoiSinh: "Bệnh viện Phụ sản Hà Nội",
        QueQuan: "Phường Định Công, Quận Hoàng Mai, Hà Nội",
        NoiThuongTru: "Số 18 ngõ 61 Lê Đức Thọ, Nam Từ Liêm, Hà Nội",
        NoiTamTru: "Số 18 ngõ 61 Lê Đức Thọ, Nam Từ Liêm, Hà Nội",
        DanToc: "Kinh",
        TonGiao: "Không",
        ThanhPhanGiaDinh: "Công chức",
        NgheNghiepHienNay: "Giảng viên chính",
        NgheNghiepKhiVaoDang: "Học viên sĩ quan",
        NgayVaoDang: "2008-05-19",
        ChiBoVaoDang: "Chi bộ Học viên Đại đội 10, Khoa Quân báo",
        NguoiGioiThieu1: "Đại tá Bùi Xuân Trường",
        ChucVuNGT1: "Trưởng bộ môn Quân báo",
        NguoiGioiThieu2: "Thiếu tá Lý Văn Đông",
        ChucVuNGT2: "Giảng viên Bộ môn Quân báo",
        NgayQuyetDinhKetNap: "2008-05-10",
        NgayChinhThuc: "2009-05-19",
        ChiBoChinhThuc: "Chi bộ Quân báo",
        NoiSinhHoatDang: "Chi bộ Quân báo",
        ChucVuDang: "Chi ủy viên",
        NgayVaoDoan: "2000-03-26",
        ToChucXaHoi: "Hội Phụ nữ Quân đội",
        GiaoDucPhoThong: "12/12",
        GiaoDucNgheNghiep: "Không",
        GiaoDucDaiHoc: "Học viện Khoa học Quân sự - Kỹ sư Quân báo",
        HocVi: "Tiến sĩ Khoa học Quân sự",
        HocHam: "Không",
        LyLuanChinhTri: "Cao cấp",
        NgoaiNgu: "Tiếng Anh C1, Tiếng Trung HSK4",
        TinHoc: "Thành thạo",
        NgayTuyenDung: "2003-09-05",
        CoQuanTuyenDung: "Học viện Khoa học Quân sự",
        NgayNhapNgu: "2003-09-05",
        CapBac: "Thiếu tá",
        CongViecChinh: "Giảng viên chính Bộ môn Quân báo",
        TinhTrangSucKhoe: "Tốt (Loại 1)",
        ThuongBinhLoai: "Không",
        GiaDinhLietSy: false,
        GiaDinhCoCong: false,
        SoCMND: "001184001234",
        SoCMTQD: "QĐ-0748392",
        KhenThuong:
          "Chiến sĩ thi đua cơ sở (2023); Bằng khen Giám đốc Học viện (2024)",
        HuyHieuDang: "Chưa",
        DanhHieuPhongTang: "Không",
        KyLuat: "Không",
        QuanHeGiaDinh: [
          {
            QuanHe: "Bố đẻ",
            HoTen: "Đỗ Văn Thịnh",
            NamSinh: "1957",
            ThongTin: "Cán bộ nghỉ hưu, Hà Nội",
          },
          {
            QuanHe: "Chồng",
            HoTen: "Trần Quốc Việt",
            NamSinh: "1982",
            ThongTin: "Sĩ quan Quân đội, Thiếu tá, Bộ Tổng Tham mưu",
          },
          {
            QuanHe: "Con gái",
            HoTen: "Trần Đỗ Khánh Linh",
            NamSinh: "2012",
            ThongTin: "Học sinh Tiểu học",
          },
        ],
        QuaTrinhCongTac: [
          {
            TuThangNam: "2003-09-01",
            DenThangNam: "2008-08-01",
            LamGiChucVuDonVi: "Học viên Đại đội 10, Tiểu đoàn 2, Học viện KHQS",
          },
          {
            TuThangNam: "2008-09-01",
            DenThangNam: null,
            LamGiChucVuDonVi:
              "Giảng viên Bộ môn Quân báo, Khoa Trinh sát - Quân báo",
          },
        ],
        QuaTrinhDaoTao: [
          {
            TenTruong: "Học viện Khoa học Quân sự",
            NganhHoc: "Quân báo",
            TuNgay: "2003-09-01",
            DenNgay: "2008-07-31",
            HinhThuc: "Chính quy quân sự",
            VanBangCert: "Bằng Kỹ sư",
          },
          {
            TenTruong: "Học viện Quốc phòng",
            NganhHoc: "Khoa học Quân sự",
            TuNgay: "2013-09-01",
            DenNgay: "2017-08-30",
            HinhThuc: "Bán tập trung",
            VanBangCert: "Bằng Tiến sĩ",
          },
        ],
        LichSuQuanHam: [
          {
            CapBac: "Đại úy",
            ChucVu: "Giảng viên",
            DonVi: "Học viện KHQS",
            NgayHieuLuc: "2012-08-01",
            SoQuyetDinh: "QĐ-1123/BQP",
          },
          {
            CapBac: "Thiếu tá",
            ChucVu: "Giảng viên chính",
            DonVi: "Học viện KHQS",
            NgayHieuLuc: "2019-08-01",
            SoQuyetDinh: "QĐ-2481/BQP",
          },
        ],
        DanhGiaDangVien: [
          {
            Nam: 2023,
            XepLoai: "Tốt",
            NhanXet:
              "Hoàn thành tốt nhiệm vụ giảng dạy và nghiên cứu khoa học.",
            TrangThai: "APPROVED",
          },
          {
            Nam: 2024,
            XepLoai: "Xuất sắc",
            NhanXet:
              "Hoàn thành xuất sắc nhiệm vụ, đạt danh hiệu Chiến sĩ thi đua cơ sở.",
            TrangThai: "APPROVED",
          },
          {
            Nam: 2025,
            XepLoai: "Tốt",
            NhanXet: "Nhất trí đề xuất Hoàn thành tốt nhiệm vụ.",
            TrangThai: "DRAFT",
          },
        ],
      },
    ];

    console.log(
      `  ✅ Đã chuẩn bị xong dữ liệu cho ${membersData.length} đảng viên.`,
    );

    // 5. Chạy hàm tạo từng đảng viên
    console.log("\n⚡ Đang ghi nhận hồ sơ Đảng viên vào cơ sở dữ liệu...");
    for (let i = 0; i < membersData.length; i++) {
      const m = membersData[i];
      console.log(
        `  ➕ Tạo hồ sơ Đảng viên (${i + 1}/${membersData.length}): ${m.HoTenDangDung} (${m.toChucDangName})`,
      );
      await createFullDangVien(m, orgMap);
    }

    console.log(
      `\n✅ Đã tạo đầy đủ ${membersData.length} hồ sơ Đảng viên mẫu chi tiết`,
    );
    console.log("🌱 Seed dữ liệu thành công rực rỡ!");
  } catch (error) {
    console.error("❌ Lỗi trong quá trình seed dữ liệu:", error);
    throw error;
  }
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });
