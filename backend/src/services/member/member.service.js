const memberRepository = require("../../repositories/member/member.repository");
const memberPartyRepository = require("../../repositories/member/memberParty.repository");
const memberHistoryRepository = require("../../repositories/member/memberHistory.repository");
const { mapToFrontend } = require("../../domain/mappers/member.mapper");
const {
  validateWritePermission,
} = require("../../domain/policies/member.policy");
const orgRepository = require("../../repositories/org.repository");
const {
  validateMemberInput,
} = require("../../domain/validators/member.validation");
const prisma = require("../../infrastructure/database/prisma");
const { ROLES } = require("../../domain/constants/member.constants");

/**
 * Đồng bộ một danh sách con (quan hệ gia đình, quá trình công tác...) theo kiểu diff:
 * bản ghi có Id và còn tồn tại thì update, không có Id thì tạo mới, còn lại trong existingMap
 * (nghĩa là không còn xuất hiện trong newRecords nữa) thì xóa.
 * @param {Array<Object>} existingRecords
 * @param {Array<Object>} newRecords
 * @param {Function} updateFn
 * @param {Function} createFn
 * @param {Function} deleteFn
 * @returns {Promise<void>}
 */
const syncArrayData = async (
  existingRecords,
  newRecords,
  updateFn,
  createFn,
  deleteFn,
) => {
  const existingMap = new Map(existingRecords.map((r) => [r.Id, r]));

  for (const newRec of newRecords) {
    const { Id, ...payload } = newRec;
    if (Id && existingMap.has(Id)) {
      await updateFn(Id, payload);
      existingMap.delete(Id);
    } else {
      await createFn(payload);
    }
  }

  for (const [id, _] of existingMap) {
    await deleteFn(id);
  }
};

/**
 * Chặn trùng Số lý lịch / Số thẻ Đảng viên trước khi ghi.
 * Lưu ý: khi update thì loại trừ chính bản ghi đang sửa ra khỏi điều kiện so trùng.
 * @param {Object} data
 * @param {boolean} isCreate
 * @param {string} memberId
 * @returns {Promise<void>}
 */
const assertUniqueIdentifiers = async (data, isCreate, memberId) => {
  const { SoLyLich, SoTheDangVien } = data;

  if (SoLyLich && SoLyLich.trim() !== "") {
    const existing = await memberRepository.findFirst({
      where: isCreate
        ? { SoLyLich: SoLyLich.trim() }
        : { SoLyLich: SoLyLich.trim(), Id: { not: memberId } },
    });
    if (existing) throw new Error(`Số lý lịch "${SoLyLich}" đã tồn tại.`);
  }

  if (SoTheDangVien && SoTheDangVien.trim() !== "") {
    const existing = await memberRepository.findFirst({
      where: isCreate
        ? { SoTheDangVien: SoTheDangVien.trim() }
        : { SoTheDangVien: SoTheDangVien.trim(), Id: { not: memberId } },
    });
    if (existing)
      throw new Error(`Số thẻ Đảng viên "${SoTheDangVien}" đã tồn tại.`);
  }
};

/**
 * Tạo/cập nhật bản ghi gốc DangVien (các field còn lại nằm rải ở các bảng con, xử lý riêng
 * ở `upsertProfileSections`).
 * @param {Object} data
 * @param {string} orgId
 * @param {boolean} isCreate
 * @param {string} memberId
 * @returns {Promise<Object>}
 */
const saveRootEntity = async (data, orgId, isCreate, memberId) => {
  const { SoLyLich, SoTheDangVien, TrangThai } = data;

  const prismaData = {
    SoLyLich: SoLyLich && SoLyLich.trim() !== "" ? SoLyLich.trim() : null,
    SoTheDangVien:
      SoTheDangVien && SoTheDangVien.trim() !== "" ? SoTheDangVien.trim() : null,
    TrangThai: TrangThai || "HOAT_DONG",
    ToChucDang: { connect: { Id: orgId } },
  };

  let dv;
  if (isCreate) {
    dv = await memberRepository.create(prismaData);
    memberId = dv.Id;
  } else {
    dv = await memberRepository.update(memberId, prismaData);
  }
  return { dv, memberId };
};

/**
 * Ghi các nhóm thông tin lý lịch (cá nhân, Đảng, học vấn, quân ngũ, sức khỏe, khen thưởng/kỷ luật...)
 * vào từng bảng con tương ứng. Khi tạo mới thì field thiếu sẽ có giá trị mặc định; khi cập nhật thì
 * field không gửi lên (undefined) được giữ nguyên giá trị cũ nhờ Prisma bỏ qua field undefined.
 * @param {string} memberId
 * @param {Object} data
 * @param {boolean} isCreate
 * @returns {Promise<void>}
 */
const upsertProfileSections = async (memberId, data, isCreate) => {
  const {
    HoTenDangDung,
    HoTenKhaiSinh,
    GioiTinh,
    NgaySinh,
    NoiSinh,
    QueQuan,
    NoiThuongTru,
    NoiTamTru,
    DanToc,
    TonGiao,
    ThanhPhanGiaDinh,
    NgheNghiepHienNay,
    NgheNghiepKhiVaoDang,
    NgayVaoDang,
    ChiBoVaoDang,
    NguoiGioiThieu1,
    ChucVuNGT1,
    NguoiGioiThieu2,
    ChucVuNGT2,
    NgayQuyetDinhKetNap,
    NgayChinhThuc,
    ChiBoChinhThuc,
    NoiSinhHoatDang,
    ChucVuDang,
    NgayVaoDoan,
    ToChucXaHoi,
    NgayTuyenDung,
    CoQuanTuyenDung,
    NgayNhapNgu,
    NgayXuatNgu,
    NgayTaiNgu,
    CapBac,
    CongViecChinh,
    GiaoDucPhoThong,
    GiaoDucNgheNghiep,
    GiaoDucDaiHoc,
    HocVi,
    HocHam,
    LyLuanChinhTri,
    NgoaiNgu,
    TinHoc,
    TinhTrangSucKhoe,
    ThuongBinhLoai,
    GiaDinhLietSy,
    GiaDinhCoCong,
    SoCMND,
    SoCMTQD,
    NgayMienCongTac,
    KhenThuong,
    HuyHieuDang,
    DanhHieuPhongTang,
    KyLuat,
    SoQuyetDinhKhenThuong,
    LichSuBanThan,
    QuanHeNuocNgoai,
    HoanCanhKinhTe,
  } = data;

  await memberRepository.upsertPersonalInfo(memberId, {
    HoTenDangDung:
      HoTenDangDung !== undefined ? HoTenDangDung : isCreate ? "" : undefined,
    HoTenKhaiSinh:
      HoTenKhaiSinh !== undefined
        ? HoTenKhaiSinh
        : isCreate
          ? HoTenDangDung || ""
          : undefined,
    GioiTinh: GioiTinh !== undefined ? GioiTinh : isCreate ? "Nam" : undefined,
    NgaySinh: NgaySinh ? new Date(NgaySinh) : isCreate ? new Date() : undefined,
    NoiSinh: NoiSinh !== undefined ? NoiSinh : isCreate ? "" : undefined,
    QueQuan: QueQuan !== undefined ? QueQuan : isCreate ? "" : undefined,
    NoiThuongTru:
      NoiThuongTru !== undefined ? NoiThuongTru : isCreate ? "" : undefined,
    NoiTamTru: NoiTamTru !== undefined ? NoiTamTru : isCreate ? "" : undefined,
    DanToc: DanToc !== undefined ? DanToc : isCreate ? "" : undefined,
    TonGiao: TonGiao !== undefined ? TonGiao : isCreate ? "" : undefined,
    ThanhPhanGiaDinh:
      ThanhPhanGiaDinh !== undefined
        ? ThanhPhanGiaDinh
        : isCreate
          ? ""
          : undefined,
    NgheNghiepHienNay:
      NgheNghiepHienNay !== undefined
        ? NgheNghiepHienNay
        : isCreate
          ? ""
          : undefined,
    NgheNghiepKhiVaoDang:
      NgheNghiepKhiVaoDang !== undefined
        ? NgheNghiepKhiVaoDang
        : isCreate
          ? ""
          : undefined,
    SoCMND: SoCMND !== undefined ? SoCMND : isCreate ? "" : undefined,
    SoCMTQD: SoCMTQD !== undefined ? SoCMTQD : isCreate ? "" : undefined,
  });

  await memberPartyRepository.upsertPartyInfo(memberId, {
    NgayVaoDang:
      NgayVaoDang !== undefined
        ? NgayVaoDang
          ? new Date(NgayVaoDang)
          : null
        : isCreate
          ? null
          : undefined,
    ChiBoVaoDang:
      ChiBoVaoDang !== undefined ? ChiBoVaoDang : isCreate ? "" : undefined,
    NguoiGioiThieu1:
      NguoiGioiThieu1 !== undefined
        ? NguoiGioiThieu1
        : isCreate
          ? ""
          : undefined,
    ChucVuNGT1:
      ChucVuNGT1 !== undefined ? ChucVuNGT1 : isCreate ? "" : undefined,
    NguoiGioiThieu2:
      NguoiGioiThieu2 !== undefined
        ? NguoiGioiThieu2
        : isCreate
          ? ""
          : undefined,
    ChucVuNGT2:
      ChucVuNGT2 !== undefined ? ChucVuNGT2 : isCreate ? "" : undefined,
    NgayQuyetDinhKetNap:
      NgayQuyetDinhKetNap !== undefined
        ? NgayQuyetDinhKetNap
          ? new Date(NgayQuyetDinhKetNap)
          : null
        : isCreate
          ? null
          : undefined,
    NgayChinhThuc:
      NgayChinhThuc !== undefined
        ? NgayChinhThuc
          ? new Date(NgayChinhThuc)
          : null
        : isCreate
          ? null
          : undefined,
    ChiBoChinhThuc:
      ChiBoChinhThuc !== undefined ? ChiBoChinhThuc : isCreate ? "" : undefined,
    NoiSinhHoatDang:
      NoiSinhHoatDang !== undefined
        ? NoiSinhHoatDang
        : isCreate
          ? ""
          : undefined,
    ChucVuDang:
      ChucVuDang !== undefined ? ChucVuDang : isCreate ? "" : undefined,
    NgayVaoDoan:
      NgayVaoDoan !== undefined
        ? NgayVaoDoan
          ? new Date(NgayVaoDoan)
          : null
        : isCreate
          ? null
          : undefined,
    ToChucXaHoi:
      ToChucXaHoi !== undefined ? ToChucXaHoi : isCreate ? "" : undefined,
    NgayMienCongTac:
      NgayMienCongTac !== undefined
        ? NgayMienCongTac
          ? new Date(NgayMienCongTac)
          : null
        : isCreate
          ? null
          : undefined,
  });

  await memberRepository.upsertAcademicLevel(memberId, {
    GiaoDucPhoThong:
      GiaoDucPhoThong !== undefined
        ? GiaoDucPhoThong
        : isCreate
          ? ""
          : undefined,
    GiaoDucNgheNghiep:
      GiaoDucNgheNghiep !== undefined
        ? GiaoDucNgheNghiep
        : isCreate
          ? ""
          : undefined,
    GiaoDucDaiHoc:
      GiaoDucDaiHoc !== undefined ? GiaoDucDaiHoc : isCreate ? "" : undefined,
    HocVi: HocVi !== undefined ? HocVi : isCreate ? "" : undefined,
    HocHam: HocHam !== undefined ? HocHam : isCreate ? "" : undefined,
    LyLuanChinhTri:
      LyLuanChinhTri !== undefined ? LyLuanChinhTri : isCreate ? "" : undefined,
    NgoaiNgu: NgoaiNgu !== undefined ? NgoaiNgu : isCreate ? "" : undefined,
    TinHoc: TinHoc !== undefined ? TinHoc : isCreate ? "" : undefined,
  });

  await memberRepository.upsertMilitaryRecruitment(memberId, {
    NgayTuyenDung:
      NgayTuyenDung !== undefined
        ? NgayTuyenDung
          ? new Date(NgayTuyenDung)
          : null
        : isCreate
          ? null
          : undefined,
    CoQuanTuyenDung:
      CoQuanTuyenDung !== undefined
        ? CoQuanTuyenDung
        : isCreate
          ? ""
          : undefined,
    NgayNhapNgu:
      NgayNhapNgu !== undefined
        ? NgayNhapNgu
          ? new Date(NgayNhapNgu)
          : null
        : isCreate
          ? null
          : undefined,
    NgayXuatNgu:
      NgayXuatNgu !== undefined
        ? NgayXuatNgu
          ? new Date(NgayXuatNgu)
          : null
        : isCreate
          ? null
          : undefined,
    NgayTaiNgu:
      NgayTaiNgu !== undefined
        ? NgayTaiNgu
          ? new Date(NgayTaiNgu)
          : null
        : isCreate
          ? null
          : undefined,
    CapBac: CapBac !== undefined ? CapBac : isCreate ? "" : undefined,
    CongViecChinh:
      CongViecChinh !== undefined ? CongViecChinh : isCreate ? "" : undefined,
  });

  await memberRepository.upsertHealthPolicy(memberId, {
    TinhTrangSucKhoe:
      TinhTrangSucKhoe !== undefined
        ? TinhTrangSucKhoe
        : isCreate
          ? ""
          : undefined,
    ThuongBinhLoai:
      ThuongBinhLoai !== undefined ? ThuongBinhLoai : isCreate ? "" : undefined,
    GiaDinhLietSy:
      GiaDinhLietSy !== undefined
        ? !!GiaDinhLietSy
        : isCreate
          ? false
          : undefined,
    GiaDinhCoCong:
      GiaDinhCoCong !== undefined
        ? !!GiaDinhCoCong
        : isCreate
          ? false
          : undefined,
  });

  // Khen thưởng chỉ được gắn với quyết định đã có sẵn trong hệ thống (nhập ở trang Quản lý
  // quyết định) — không tự tạo QĐ mới ở đây, giống cách LichSuQuanHam bên dưới đang làm.
  let quyetDinhKhenThuongId;
  if (SoQuyetDinhKhenThuong !== undefined) {
    const soQd = (SoQuyetDinhKhenThuong || "").trim();
    const qd = soQd
      ? await prisma.quyetDinh.findFirst({ where: { SoQuyetDinh: soQd } })
      : null;
    quyetDinhKhenThuongId = qd ? qd.Id : null;
  }

  await memberRepository.upsertRewardDiscipline(memberId, {
    KhenThuong:
      KhenThuong !== undefined ? KhenThuong : isCreate ? "" : undefined,
    HuyHieuDang:
      HuyHieuDang !== undefined ? HuyHieuDang : isCreate ? "" : undefined,
    DanhHieuPhongTang:
      DanhHieuPhongTang !== undefined
        ? DanhHieuPhongTang
        : isCreate
          ? ""
          : undefined,
    KyLuat: KyLuat !== undefined ? KyLuat : isCreate ? "" : undefined,
    QuyetDinhId:
      quyetDinhKhenThuongId !== undefined
        ? quyetDinhKhenThuongId
        : isCreate
          ? null
          : undefined,
  });

  await memberRepository.upsertBackgroundFeatures(memberId, {
    LichSuBanThan:
      LichSuBanThan !== undefined
        ? LichSuBanThan || {}
        : isCreate
          ? {}
          : undefined,
    QuanHeNuocNgoai:
      QuanHeNuocNgoai !== undefined
        ? QuanHeNuocNgoai || {}
        : isCreate
          ? {}
          : undefined,
    HoanCanhKinhTe:
      HoanCanhKinhTe !== undefined
        ? HoanCanhKinhTe || {}
        : isCreate
          ? {}
          : undefined,
  });
};

/**
 * Đồng bộ các danh sách con của đảng viên (quan hệ gia đình, công tác, đào tạo, quân hàm, đánh giá).
 * @param {string} memberId
 * @param {Object} data
 * @returns {Promise<void>}
 */
const syncMemberCollections = async (memberId, data) => {
  const { QuaTrinhCongTac, QuaTrinhDaoTao, LichSuQuanHam, DanhGiaDangVien } =
    data;
  const existingMember = await memberRepository.findById(memberId);

  // Đồng bộ quan hệ gia đình
  if (Array.isArray(data.QuanHeGiaDinh)) {
    await syncArrayData(
      existingMember.DanhSachQuanHeGiaDinh || [],
      data.QuanHeGiaDinh.map((qh) => ({
        Id: qh.Id,
        DangVienId: memberId,
        QuanHe: qh.QuanHe || "",
        HoTen: qh.HoTen || "",
        NamSinh: String(qh.NamSinh || ""),
        ThongTin: qh.ThongTin || "",
      })),
      async (id, dt) => memberRepository.updateFamilyRelation(id, dt),
      async (dt) => memberRepository.createFamilyRelation(dt),
      async (id) => memberRepository.deleteFamilyRelation(id),
    );
  }

  // Đồng bộ quá trình công tác
  if (Array.isArray(QuaTrinhCongTac)) {
    await syncArrayData(
      existingMember.DanhSachCongTac || [],
      QuaTrinhCongTac.map((emp) => ({
        Id: emp.Id,
        DangVienId: memberId,
        TuThangNam: emp.TuThangNam ? new Date(emp.TuThangNam) : new Date(),
        DenThangNam: emp.DenThangNam ? new Date(emp.DenThangNam) : null,
        LamGiChucVuDonVi: emp.LamGiChucVuDonVi || "",
      })),
      async (id, dt) => memberHistoryRepository.updateWorkHistory(id, dt),
      async (dt) => memberHistoryRepository.createWorkHistory(dt),
      async (id) => memberHistoryRepository.deleteWorkHistory(id),
    );
  }

  // Đồng bộ quá trình đào tạo
  if (Array.isArray(QuaTrinhDaoTao)) {
    await syncArrayData(
      existingMember.DanhSachDaoTao || [],
      QuaTrinhDaoTao.map((t) => ({
        Id: t.Id,
        DangVienId: memberId,
        TenTruong: t.TenTruong || "Chưa rõ",
        NganhHoc: t.NganhHoc || "",
        TuNgay: t.TuNgay ? new Date(t.TuNgay) : new Date(),
        DenNgay: t.DenNgay ? new Date(t.DenNgay) : new Date(),
        HinhThuc: t.HinhThuc || "Chính quy",
        VanBangChungChi: t.VanBangChungChi || t.VanBangCert || "",
        TaiLieuUrl: t.TaiLieuUrl || null,
        TaiLieuName: t.TaiLieuName || null,
      })),
      async (id, dt) => memberHistoryRepository.updateTraining(id, dt),
      async (dt) => memberHistoryRepository.createTraining(dt),
      async (id) => memberHistoryRepository.deleteTraining(id),
    );
  }

  // Đồng bộ lịch sử phong quân hàm, có liên kết với Quyết định liên quan
  if (Array.isArray(LichSuQuanHam)) {
    const mappedRankHistories = [];
    for (const r of LichSuQuanHam) {
      let qdId = r.QuyetDinhId || null;
      let effDate = r.NgayHieuLuc ? new Date(r.NgayHieuLuc) : new Date();
      let soQd = r.SoQuyetDinh || "";

      let qd = null;
      if (qdId) {
        qd = await prisma.quyetDinh.findUnique({ where: { Id: qdId } });
      } else if (soQd && soQd.trim() !== "") {
        qd = await prisma.quyetDinh.findFirst({ where: { SoQuyetDinh: soQd } });
      }

      if (qd) {
        qdId = qd.Id;
        soQd = qd.SoQuyetDinh;
        effDate = qd.NgayBanHanh;
      }

      mappedRankHistories.push({
        Id: r.Id,
        DangVienId: memberId,
        CapBac: r.CapBac || "Binh nhì",
        ChucVu: r.ChucVu || "",
        DonVi: r.DonVi || "",
        NgayHieuLuc: effDate,
        SoQuyetDinh: soQd,
        QuyetDinhId: qdId,
      });
    }

    await syncArrayData(
      existingMember.DanhSachQuanHam || [],
      mappedRankHistories,
      async (id, dt) => memberHistoryRepository.updateRankHistory(id, dt),
      async (dt) => memberHistoryRepository.createRankHistory(dt),
      async (id) => memberHistoryRepository.deleteRankHistory(id),
    );
  }

  // Đồng bộ kết quả đánh giá phân tích chất lượng Đảng viên hàng năm
  if (Array.isArray(DanhGiaDangVien)) {
    const mappedEvaluations = [];
    for (const ev of DanhGiaDangVien) {
      let qdId = ev.QuyetDinhId || null;
      let soQd = ev.SoQuyetDinh || ev.QuyetDinh?.SoQuyetDinh || "";

      let qd = null;
      if (qdId) {
        qd = await prisma.quyetDinh.findUnique({ where: { Id: qdId } });
      } else if (soQd && soQd.trim() !== "") {
        qd = await prisma.quyetDinh.findFirst({ where: { SoQuyetDinh: soQd } });
      }

      if (qd) {
        qdId = qd.Id;
        soQd = qd.SoQuyetDinh;
      }

      mappedEvaluations.push({
        Id: ev.Id,
        DangVienId: memberId,
        Nam: parseInt(ev.Nam, 10) || new Date().getFullYear(),
        XepLoai: ev.XepLoai || "Chưa rõ",
        NhanXet: ev.NhanXet || "",
        TrangThai: ev.TrangThai || "APPROVED",
        SoQuyetDinh: soQd,
        QuyetDinhId: qdId,
      });
    }

    await syncArrayData(
      existingMember.DanhSachDanhGia || [],
      mappedEvaluations,
      async (id, dt) => memberPartyRepository.updateEvaluation(id, dt),
      async (dt) => memberPartyRepository.createEvaluation(dt),
      async (id) => memberPartyRepository.deleteEvaluation(id),
    );
  }
};

/**
 * Điểm vào chung cho tạo mới/cập nhật hồ sơ đảng viên: validate, ghi bảng gốc, rồi ghi các
 * bảng con. Bắt riêng lỗi P2002 (trùng unique constraint) để trả thông báo dễ hiểu hơn cho người dùng.
 * @param {Object} data
 * @param {string} orgId
 * @param {boolean} isCreate
 * @param {string} memberId
 * @returns {Promise<Object>}
 */
const saveDangVien = async (data, orgId, isCreate = false, memberId = null) => {
  validateMemberInput(data);
  await assertUniqueIdentifiers(data, isCreate, memberId);

  let saved;
  try {
    saved = await saveRootEntity(data, orgId, isCreate, memberId);
  } catch (error) {
    if (error.code === "P2002") {
      const field = error.meta?.target?.includes?.("soTheDangVien")
        ? "Số thẻ Đảng viên"
        : "Số lý lịch";
      throw new Error(`${field} đã tồn tại, vui lòng kiểm tra lại.`);
    }
    throw error;
  }
  memberId = saved.memberId;

  await upsertProfileSections(memberId, data, isCreate);
  await syncMemberCollections(memberId, data);

  return saved.dv;
};

/**
 * Lấy toàn bộ đảng viên trong phạm vi user được xem: Cán bộ chính trị thấy tất cả, Bí thư chỉ
 * thấy đảng viên thuộc chi bộ mình cộng thêm những người từng thuộc chi bộ đó (suy ra từ audit log,
 * vì đảng viên có thể đã chuyển sinh hoạt sang tổ chức khác).
 * @param {Object} user
 * @returns {Promise<Array<Object>>}
 */
const getAllMembers = async (user) => {
  const auditLogs = await memberRepository.findAuditLogs({
    TenBang: "DANG_VIEN",
    HanhDong: { in: ["CREATE", "UPDATE"] },
  });
  const logsByMember = {};
  auditLogs.forEach((log) => {
    if (!logsByMember[log.BanGhiId]) logsByMember[log.BanGhiId] = [];
    logsByMember[log.BanGhiId].push(log);
  });

  let list;
  if (user.role === ROLES.CAN_BO_CHINH_TRI) {
    list = await memberRepository.findAllWithInclude(
      {},
      memberRepository.include,
    );
  } else {
    const historicalMemberIds = new Set();
    auditLogs.forEach((log) => {
      if (
        log.GiaTriCu?.ToChucDangId === user.orgId ||
        log.GiaTriMoi?.ToChucDangId === user.orgId
      ) {
        historicalMemberIds.add(log.BanGhiId);
      }
    });
    list = await memberRepository.findAllWithInclude(
      {
        OR: [
          { ToChucDangId: user.orgId },
          { Id: { in: Array.from(historicalMemberIds) } },
        ],
      },
      memberRepository.include,
    );
  }

  const allOrgs = await orgRepository.findAll();
  const orgMap = new Map(allOrgs.map((o) => [o.Id, o]));

  return list.map((dv) => {
    const mapped = mapToFrontend(dv, orgMap);
    const memberLogs = logsByMember[dv.Id] || [];
    const orgHistory = [
      {
        date: (
          dv.ThongTinVaoDang?.NgayVaoDang ||
          dv.CreatedAt ||
          new Date()
        ).toISOString(),
        orgId: dv.ToChucDangId,
      },
    ];
    memberLogs.forEach((log) => {
      if (log.HanhDong === "CREATE" && log.GiaTriMoi?.ToChucDangId) {
        orgHistory[0] = {
          date: log.CreatedAt.toISOString(),
          orgId: log.GiaTriMoi.ToChucDangId,
        };
      } else if (
        log.HanhDong === "UPDATE" &&
        log.GiaTriMoi?.ToChucDangId &&
        log.GiaTriCu?.ToChucDangId &&
        log.GiaTriMoi.ToChucDangId !== log.GiaTriCu.ToChucDangId
      ) {
        orgHistory.push({
          date: log.CreatedAt.toISOString(),
          orgId: log.GiaTriMoi.ToChucDangId,
        });
      }
    });
    mapped.orgHistory = orgHistory.sort(
      (a, b) => new Date(a.date) - new Date(b.date),
    );
    return mapped;
  });
};

/**
 * Get member by id
 * @param {string} memberId
 * @param {Object} user
 * @returns {Promise<Object>}
 */
const getMemberById = async (memberId, user) => {
  const member = await memberRepository.findById(memberId);
  if (!member) throw new Error("Không tìm thấy đảng viên");
  if (user.role === ROLES.BI_THU && member.ToChucDangId !== user.orgId) {
    throw new Error("Bạn không có quyền xem hồ sơ của đơn vị khác");
  }
  const allOrgs = await orgRepository.findAll();
  return mapToFrontend(member, new Map(allOrgs.map((o) => [o.Id, o])));
};

/**
 * Tạo mới hồ sơ đảng viên
 * @param {object} data - Dữ liệu lý lịch đảng viên
 * @param {object} user - Thông tin người dùng
 * @returns {Promise<object>} - Hồ sơ đảng viên đã được map sang frontend format
 */
const createMember = async (data, user) => {
  validateMemberInput(data);
  const userOrg = await orgRepository.findById(user.orgId);
  // Cán bộ chính trị chỉ được thêm hồ sơ khi gắn với tổ chức gốc (không có cha) —
  // tức tài khoản cấp toàn hệ thống, không phải tài khoản của một chi bộ cụ thể.
  if (
    user.role === ROLES.CAN_BO_CHINH_TRI &&
    (!userOrg || userOrg.ToChucChaId !== null)
  ) {
    throw new Error("Bạn không có quyền thêm hồ sơ mới");
  }
  const dv = await saveDangVien(data, user.orgId, true, null);
  const created = await memberRepository.findById(dv.Id);
  const allOrgs = await orgRepository.findAll();
  return mapToFrontend(created, new Map(allOrgs.map((o) => [o.Id, o])));
};

/**
 * Cập nhật hồ sơ đảng viên
 * @param {string} memberId - ID của đảng viên
 * @param {object} data - Dữ liệu lý lịch cập nhật
 * @param {object} user - Thông tin người dùng
 * @returns {Promise<object>} - Hồ sơ đảng viên sau khi cập nhật
 */
const updateMember = async (memberId, data, user) => {
  const member = await validateWritePermission(memberId, user);
  await saveDangVien(data, member.ToChucDangId, false, memberId);
  const allOrgs = await orgRepository.findAll();
  const updatedFull = await memberRepository.findById(memberId);
  return mapToFrontend(updatedFull, new Map(allOrgs.map((o) => [o.Id, o])));
};

/**
 * Xóa hồ sơ đảng viên
 * @param {string} memberId - ID của đảng viên
 * @param {object} user - Thông tin người dùng
 * @returns {Promise<void>}
 */
const deleteMember = async (memberId, user) => {
  await validateWritePermission(memberId, user);
  await memberRepository.delete(memberId);
};

module.exports = {
  saveDangVien,
  getAllMembers,
  getMemberById,
  createMember,
  updateMember,
  deleteMember,
};
