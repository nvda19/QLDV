const prisma = require("../infrastructure/database/prisma");

function attachBadgeAliases(b) {
  if (!b) return null;
  if (b.id !== undefined) b.Id = b.id;
  if (b.dangVienId !== undefined) b.DangVienId = b.dangVienId;
  if (b.loaiDeXuat !== undefined) b.LoaiDeXuat = b.loaiDeXuat;
  if (b.mocHuyHieu !== undefined) b.MocHuyHieu = b.mocHuyHieu;
  if (b.trangThai !== undefined) b.TrangThai = b.trangThai;
  if (b.soHuyHieu !== undefined) b.SoHuyHieu = b.soHuyHieu;
  if (b.soQuyetDinhCaNhan !== undefined) b.SoQuyetDinhCaNhan = b.soQuyetDinhCaNhan;
  if (b.soQuyetDinhTapThe !== undefined) b.SoQuyetDinhTapThe = b.soQuyetDinhTapThe;
  if (b.ngayQuyetDinh !== undefined) b.NgayQuyetDinh = b.ngayQuyetDinh;
  if (b.lyDoTuChoi !== undefined) b.LyDoTuChoi = b.lyDoTuChoi;
  if (b.nguoiDeXuatId !== undefined) b.NguoiDeXuatId = b.nguoiDeXuatId;
  if (b.nguoiDuyetId !== undefined) b.NguoiDuyetId = b.nguoiDuyetId;
  if (b.quyetDinhId !== undefined) b.QuyetDinhId = b.quyetDinhId;
  if (b.createdAt !== undefined) b.CreatedAt = b.createdAt;
  if (b.updatedAt !== undefined) b.UpdatedAt = b.updatedAt;
  if (b.dangVien) {
    b.DangVien = b.dangVien;
    b.dangVien.Id = b.dangVien.id;
    b.dangVien.ToChucDangId = b.dangVien.toChucDangId;
    b.dangVien.SoLyLich = b.dangVien.soLyLich;
    b.dangVien.SoTheDangVien = b.dangVien.soTheDangVien;
    if (b.dangVien.lyLichCaNhan) {
      b.dangVien.LyLichCaNhan = b.dangVien.lyLichCaNhan;
      b.dangVien.lyLichCaNhan.HoTenDangDung = b.dangVien.lyLichCaNhan.hoTenDangDung;
      b.dangVien.lyLichCaNhan.HoTenKhaiSinh = b.dangVien.lyLichCaNhan.hoTenKhaiSinh;
      b.dangVien.lyLichCaNhan.NgaySinh = b.dangVien.lyLichCaNhan.ngaySinh;
      b.dangVien.lyLichCaNhan.GioiTinh = b.dangVien.lyLichCaNhan.gioiTinh;
    }
    if (b.dangVien.toChucDang) {
      b.dangVien.ToChucDang = b.dangVien.toChucDang;
      b.dangVien.toChucDang.Id = b.dangVien.toChucDang.id;
      b.dangVien.toChucDang.Ten = b.dangVien.toChucDang.ten;
      b.dangVien.toChucDang.ToChucChaId = b.dangVien.toChucDang.toChucChaId;
      b.dangVien.toChucDang.ParentId = b.dangVien.toChucDang.toChucChaId;
    }
  }
  if (b.quyetDinh) {
    b.QuyetDinh = b.quyetDinh;
    b.quyetDinh.Id = b.quyetDinh.id;
    b.quyetDinh.SoQuyetDinh = b.quyetDinh.soQuyetDinh;
    b.quyetDinh.TenQuyetDinh = b.quyetDinh.tenQuyetDinh;
    b.quyetDinh.LoaiQuyetDinh = b.quyetDinh.loaiQuyetDinh;
    b.quyetDinh.NgayBanHanh = b.quyetDinh.ngayBanHanh;
    b.quyetDinh.TaiLieuUrl = b.quyetDinh.taiLieuUrl;
    b.quyetDinh.TaiLieuName = b.quyetDinh.taiLieuName;
  }
  return b;
}

function mapBadgeDataToDb(data = {}) {
  const mapped = {};
  if (data.id !== undefined || data.Id !== undefined) mapped.id = data.id !== undefined ? data.id : data.Id;
  if (data.dangVienId !== undefined || data.DangVienId !== undefined) mapped.dangVienId = data.dangVienId !== undefined ? data.dangVienId : data.DangVienId;
  if (data.loaiDeXuat !== undefined || data.LoaiDeXuat !== undefined) mapped.loaiDeXuat = data.loaiDeXuat !== undefined ? data.loaiDeXuat : data.LoaiDeXuat;
  if (data.mocHuyHieu !== undefined || data.MocHuyHieu !== undefined) mapped.mocHuyHieu = data.mocHuyHieu !== undefined ? data.mocHuyHieu : data.MocHuyHieu;
  if (data.trangThai !== undefined || data.TrangThai !== undefined) mapped.trangThai = data.trangThai !== undefined ? data.trangThai : data.TrangThai;
  if (data.soHuyHieu !== undefined || data.SoHuyHieu !== undefined) mapped.soHuyHieu = data.soHuyHieu !== undefined ? data.soHuyHieu : data.SoHuyHieu;
  if (data.soQuyetDinhCaNhan !== undefined || data.SoQuyetDinhCaNhan !== undefined) mapped.soQuyetDinhCaNhan = data.soQuyetDinhCaNhan !== undefined ? data.soQuyetDinhCaNhan : data.SoQuyetDinhCaNhan;
  if (data.soQuyetDinhTapThe !== undefined || data.SoQuyetDinhTapThe !== undefined) mapped.soQuyetDinhTapThe = data.soQuyetDinhTapThe !== undefined ? data.soQuyetDinhTapThe : data.SoQuyetDinhTapThe;
  if (data.ngayQuyetDinh !== undefined || data.NgayQuyetDinh !== undefined) mapped.ngayQuyetDinh = data.ngayQuyetDinh !== undefined ? data.ngayQuyetDinh : data.NgayQuyetDinh;
  if (data.lyDoTuChoi !== undefined || data.LyDoTuChoi !== undefined) mapped.lyDoTuChoi = data.lyDoTuChoi !== undefined ? data.lyDoTuChoi : data.LyDoTuChoi;
  if (data.nguoiDeXuatId !== undefined || data.NguoiDeXuatId !== undefined) mapped.nguoiDeXuatId = data.nguoiDeXuatId !== undefined ? data.nguoiDeXuatId : data.NguoiDeXuatId;
  if (data.nguoiDuyetId !== undefined || data.NguoiDuyetId !== undefined) mapped.nguoiDuyetId = data.nguoiDuyetId !== undefined ? data.nguoiDuyetId : data.NguoiDuyetId;
  if (data.quyetDinhId !== undefined || data.QuyetDinhId !== undefined) mapped.quyetDinhId = data.quyetDinhId !== undefined ? data.quyetDinhId : data.QuyetDinhId;
  return mapped;
}

function mapBadgeWhere(where = {}) {
  if (!where || typeof where !== "object") return where;
  const mapped = {};
  for (const [key, value] of Object.entries(where)) {
    if (key === "OR" || key === "AND" || key === "NOT") {
      if (Array.isArray(value)) {
        mapped[key] = value.map(mapBadgeWhere);
      } else {
        mapped[key] = mapBadgeWhere(value);
      }
    } else if (key === "DangVien" || key === "dangVien") {
      if (value && typeof value === "object") {
        const dvWhere = {};
        for (const [dk, dv] of Object.entries(value)) {
          if (dk === "ToChucDangId" || dk === "toChucDangId") dvWhere.toChucDangId = dv;
          else if (dk === "Id" || dk === "id") dvWhere.id = dv;
          else if (dk === "DeletedAt" || dk === "deletedAt") dvWhere.deletedAt = dv;
          else if (dk === "SoTheDangVien" || dk === "soTheDangVien") dvWhere.soTheDangVien = dv;
          else if (dk === "SoLyLich" || dk === "soLyLich") dvWhere.soLyLich = dv;
          else dvWhere[dk.charAt(0).toLowerCase() + dk.slice(1)] = dv;
        }
        mapped.dangVien = dvWhere;
      } else {
        mapped.dangVien = value;
      }
    } else if (key === "QuyetDinh" || key === "quyetDinh") {
      if (value && typeof value === "object") {
        const qdWhere = {};
        for (const [qk, qv] of Object.entries(value)) {
          if (qk === "Id" || qk === "id") qdWhere.id = qv;
          else if (qk === "SoQuyetDinh" || qk === "soQuyetDinh") qdWhere.soQuyetDinh = qv;
          else qdWhere[qk.charAt(0).toLowerCase() + qk.slice(1)] = qv;
        }
        mapped.quyetDinh = qdWhere;
      } else {
        mapped.quyetDinh = value;
      }
    } else if (key === "Id" || key === "id") {
      mapped.id = value;
    } else if (key === "DangVienId" || key === "dangVienId") {
      mapped.dangVienId = value;
    } else if (key === "TrangThai" || key === "trangThai") {
      mapped.trangThai = value;
    } else if (key === "MocHuyHieu" || key === "mocHuyHieu") {
      mapped.mocHuyHieu = value;
    } else if (key === "LoaiDeXuat" || key === "loaiDeXuat") {
      mapped.loaiDeXuat = value;
    } else if (key === "QuyetDinhId" || key === "quyetDinhId") {
      mapped.quyetDinhId = value;
    } else if (key === "SoHuyHieu" || key === "soHuyHieu") {
      mapped.soHuyHieu = value;
    } else if (key === "SoQuyetDinhCaNhan" || key === "soQuyetDinhCaNhan") {
      mapped.soQuyetDinhCaNhan = value;
    } else if (key === "SoQuyetDinhTapThe" || key === "soQuyetDinhTapThe") {
      mapped.soQuyetDinhTapThe = value;
    } else if (key === "NgayQuyetDinh" || key === "ngayQuyetDinh") {
      mapped.ngayQuyetDinh = value;
    } else if (key === "LyDoTuChoi" || key === "lyDoTuChoi") {
      mapped.lyDoTuChoi = value;
    } else if (key === "NguoiDeXuatId" || key === "nguoiDeXuatId") {
      mapped.nguoiDeXuatId = value;
    } else if (key === "NguoiDuyetId" || key === "nguoiDuyetId") {
      mapped.nguoiDuyetId = value;
    } else if (key === "CreatedAt" || key === "createdAt") {
      mapped.createdAt = value;
    } else if (key === "UpdatedAt" || key === "updatedAt") {
      mapped.updatedAt = value;
    } else {
      mapped[key] = value;
    }
  }
  return mapped;
}

function mapBadgeOptions(options = {}) {
  const mapped = { ...options };
  if (mapped.include) {
    const inc = {};
    for (const [key, val] of Object.entries(mapped.include)) {
      if (key === "DangVien" || key === "dangVien") {
        if (val && typeof val === "object" && val.include) {
          const subInc = {};
          for (const [subKey, subVal] of Object.entries(val.include)) {
            if (subKey === "LyLichCaNhan" || subKey === "lyLichCaNhan") subInc.lyLichCaNhan = subVal;
            else if (subKey === "ToChucDang" || subKey === "toChucDang") subInc.toChucDang = subVal;
            else subInc[subKey.charAt(0).toLowerCase() + subKey.slice(1)] = subVal;
          }
          inc.dangVien = { ...val, include: subInc };
        } else {
          inc.dangVien = val;
        }
      } else if (key === "QuyetDinh" || key === "quyetDinh") {
        inc.quyetDinh = val;
      } else {
        inc[key.charAt(0).toLowerCase() + key.slice(1)] = val;
      }
    }
    mapped.include = inc;
  }
  if (mapped.select) {
    const sel = {};
    for (const [key, val] of Object.entries(mapped.select)) {
      if (key === "DangVien" || key === "dangVien") sel.dangVien = val;
      else if (key === "DangVienId" || key === "dangVienId") sel.dangVienId = val;
      else if (key === "MocHuyHieu" || key === "mocHuyHieu") sel.mocHuyHieu = val;
      else if (key === "TrangThai" || key === "trangThai") sel.trangThai = val;
      else if (key === "LoaiDeXuat" || key === "loaiDeXuat") sel.loaiDeXuat = val;
      else if (key === "Id" || key === "id") sel.id = val;
      else sel[key.charAt(0).toLowerCase() + key.slice(1)] = val;
    }
    mapped.select = sel;
  }
  if (mapped.orderBy) {
    if (Array.isArray(mapped.orderBy)) {
      mapped.orderBy = mapped.orderBy.map(orderItem => {
        const o = {};
        for (const [k, v] of Object.entries(orderItem)) {
          o[k.charAt(0).toLowerCase() + k.slice(1)] = v;
        }
        return o;
      });
    } else if (typeof mapped.orderBy === "object") {
      const o = {};
      for (const [k, v] of Object.entries(mapped.orderBy)) {
        o[k.charAt(0).toLowerCase() + k.slice(1)] = v;
      }
      mapped.orderBy = o;
    }
  }
  return mapped;
}

/**
 * Repository cho bảng đề xuất Huy hiệu Đảng
 */
class BadgeRepository {
  /**
   * Tìm nhiều đề xuất Huy hiệu Đảng theo điều kiện
   * @param {Object} where Điều kiện tìm kiếm
   * @param {Object} options Tùy chọn truy vấn bổ sung (orderBy, include, ...)
   * @returns {Promise<Array<Object>>} Danh sách đề xuất Huy hiệu Đảng
   */
  async findMany(where = {}, options = {}) {
    const list = await prisma.deXuatHuyHieu.findMany({ where: mapBadgeWhere(where), ...mapBadgeOptions(options) });
    return list.map(attachBadgeAliases);
  }

  /**
   * Tìm một đề xuất Huy hiệu Đảng theo ID
   * @param {string} id ID của đề xuất Huy hiệu Đảng
   * @returns {Promise<Object|null>} Đề xuất Huy hiệu Đảng tương ứng, hoặc null nếu không tìm thấy
   */
  async findById(id) {
    const b = await prisma.deXuatHuyHieu.findUnique({ where: { id } });
    return attachBadgeAliases(b);
  }

  /**
   * Tìm đề xuất Huy hiệu Đảng đầu tiên khớp điều kiện
   * @param {Object} where Điều kiện tìm kiếm
   * @param {Object} [tx] Prisma transaction client, dùng khi gọi trong 1 transaction ngoài
   * @returns {Promise<Object|null>} Đề xuất Huy hiệu Đảng đầu tiên khớp điều kiện, hoặc null
   */
  async findFirst(where, tx = null) {
    const client = tx || prisma;
    const b = await client.deXuatHuyHieu.findFirst({ where: mapBadgeWhere(where) });
    return attachBadgeAliases(b);
  }

  /**
   * Tạo mới một đề xuất Huy hiệu Đảng
   * @param {Object} data Dữ liệu đề xuất Huy hiệu Đảng
   * @param {Object} [tx] Prisma transaction client, dùng khi gọi trong 1 transaction ngoài
   * @returns {Promise<Object>} Đề xuất Huy hiệu Đảng vừa tạo
   */
  async create(data, tx = null) {
    const client = tx || prisma;
    const b = await client.deXuatHuyHieu.create({ data: mapBadgeDataToDb(data) });
    return attachBadgeAliases(b);
  }

  /**
   * Khóa advisory theo memberId rồi kiểm tra xem đã có đề nghị/quyết định nào cho mốc này chưa
   * @param {string} memberId ID Đảng viên
   * @param {number} moc Mốc huy hiệu (số năm tuổi Đảng)
   * @param {Array<string>} statuses Danh sách trạng thái coi là "đã tồn tại"
   * @param {Object} tx Prisma transaction client
   * @returns {Promise<Object|null>} Đề nghị đã tồn tại khớp mốc, hoặc null nếu chưa có
   */
  async lockAndCheckExisting(memberId, moc, statuses, tx) {
    await tx.$queryRaw`SELECT pg_advisory_xact_lock(hashtext(${memberId}))`;
    const b = await tx.deXuatHuyHieu.findFirst({
      where: {
        dangVienId: memberId,
        mocHuyHieu: moc,
        trangThai: { in: statuses },
      },
    });
    return attachBadgeAliases(b);
  }

  /**
   * Tạo hàng loạt đề xuất Huy hiệu Đảng
   * @param {Array<Object>} data Danh sách dữ liệu đề xuất Huy hiệu Đảng
   * @returns {Promise<Object>} Kết quả tạo hàng loạt (số bản ghi đã tạo)
   */
  async createMany(data) {
    return prisma.deXuatHuyHieu.createMany({ data: data.map(mapBadgeDataToDb) });
  }

  /**
   * Cập nhật một đề xuất Huy hiệu Đảng theo ID
   * @param {string} id ID của đề xuất Huy hiệu Đảng
   * @param {Object} data Dữ liệu cần cập nhật
   * @returns {Promise<Object>} Đề xuất Huy hiệu Đảng sau khi cập nhật
   */
  async update(id, data) {
    const b = await prisma.deXuatHuyHieu.update({ where: { id }, data: mapBadgeDataToDb(data) });
    return attachBadgeAliases(b);
  }

  /**
   * Cập nhật hàng loạt đề xuất Huy hiệu Đảng theo điều kiện
   * @param {Object} where Điều kiện áp dụng
   * @param {Object} data Dữ liệu cần cập nhật
   * @param {Object} [tx] Prisma transaction client, dùng khi gọi trong 1 transaction ngoài
   * @returns {Promise<Object>} Kết quả cập nhật hàng loạt (số bản ghi bị ảnh hưởng)
   */
  async updateMany(where, data, tx = null) {
    const client = tx || prisma;
    return client.deXuatHuyHieu.updateMany({ where: mapBadgeWhere(where), data: mapBadgeDataToDb(data) });
  }
}

module.exports = new BadgeRepository();
