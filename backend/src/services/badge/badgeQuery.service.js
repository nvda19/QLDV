const badgeRepository = require("../../repositories/badge.repository");
const orgRepository = require("../../repositories/org.repository");
const { ROLES } = require("../../domain/constants/member.constants");

/**
 * Lấy danh sách đề nghị Huy hiệu Đảng theo quyền của user — Bí thư chỉ xem đề nghị
 * trong chi bộ mình + các chi bộ con, Cán bộ chính trị xem toàn bộ.
 * @param {object} user - Thông tin người dùng
 * @returns {Promise<Array<object>>} Danh sách đề nghị Huy hiệu Đảng
 */
const getBadgeProposals = async (user) => {
  let where = {};
  if (user.role === ROLES.BI_THU) {
    const allOrgs = await orgRepository.findAll();
    const ids = [user.orgId];
    const findChildren = (id) => {
      allOrgs.forEach((o) => {
        if (o.ToChucChaId === id) {
          ids.push(o.Id);
          findChildren(o.Id);
        }
      });
    };
    findChildren(user.orgId);

    where = {
      DangVien: {
        ToChucDangId: { in: ids },
      },
    };
  }

  const proposals = await badgeRepository.findMany(where, {
    include: {
      DangVien: {
        include: {
          LyLichCaNhan: true,
          ToChucDang: true,
        },
      },
      QuyetDinh: true,
    },
    orderBy: { CreatedAt: "desc" },
  });

  return proposals.map((p) => ({
    Id: p.Id,
    DangVienId: p.DangVienId,
    HoTenDangDung: p.DangVien.LyLichCaNhan?.HoTenDangDung || "",
    SoTheDangVien: p.DangVien.SoTheDangVien || "",
    ToChucDangId: p.DangVien.ToChucDangId,
    TenToChucDang: p.DangVien.ToChucDang?.Ten || "",
    LoaiDeXuat: p.LoaiDeXuat,
    MocHuyHieu: p.MocHuyHieu,
    TrangThai: p.TrangThai,
    SoHuyHieu: p.SoHuyHieu,
    SoQuyetDinhCaNhan: p.SoQuyetDinhCaNhan,
    SoQuyetDinhTapThe: p.SoQuyetDinhTapThe,
    NgayQuyetDinh: p.NgayQuyetDinh,
    LyDoTuChoi: p.LyDoTuChoi,
    TaiLieuUrl: p.QuyetDinh?.TaiLieuUrl || null,
    TaiLieuName: p.QuyetDinh?.TaiLieuName || null,
    QuyetDinhId: p.QuyetDinhId,
    QuyetDinh: p.QuyetDinh
      ? {
          Id: p.QuyetDinh.Id,
          SoQuyetDinh: p.QuyetDinh.SoQuyetDinh,
          TenQuyetDinh: p.QuyetDinh.TenQuyetDinh,
          LoaiQuyetDinh: p.QuyetDinh.LoaiQuyetDinh,
          NgayBanHanh: p.QuyetDinh.NgayBanHanh,
          TaiLieuUrl: p.QuyetDinh.TaiLieuUrl,
          TaiLieuName: p.QuyetDinh.TaiLieuName,
        }
      : null,
    CreatedAt: p.CreatedAt,
  }));
};

module.exports = { getBadgeProposals };
