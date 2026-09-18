const { saveUploadFile } = require("../files/attachmentUpload.service");
const decisionRepository = require("../../repositories/decision.repository");
const crypto = require("crypto");

/**
 * Helper dùng chung cho các nghiệp vụ đính kèm quyết định (thăng quân hàm, xếp loại,
 * huy hiệu...) — mỗi nơi không tự tạo QuyetDinh riêng lẻ mà gọi qua đây để tránh sinh
 * nhiều bản ghi trùng cho cùng một số quyết định.
 *
 * Thứ tự xử lý: nếu payload đã có QuyetDinhId hợp lệ thì dùng luôn; nếu không có nhưng
 * SoQuyetDinh trùng với quyết định đã tồn tại thì tái sử dụng bản ghi đó; chỉ khi không
 * tìm thấy gì mới tạo mới (kèm lưu file đính kèm nếu có).
 *
 * @param {Object|null} tx Prisma transaction client (nếu gọi trong 1 transaction ngoài), hoặc null
 */
const resolveQuyetDinh = async (tx, data, file, LoaiQuyetDinh) => {
  let QuyetDinhId = data.quyetDinhId !== undefined ? data.quyetDinhId : data.QuyetDinhId;
  let SoQuyetDinh = data.soQuyetDinh !== undefined ? data.soQuyetDinh : data.SoQuyetDinh;
  let TenQuyetDinh = data.tenQuyetDinh !== undefined ? data.tenQuyetDinh : data.TenQuyetDinh;
  let loaiQD = LoaiQuyetDinh || data.loaiQuyetDinh || data.LoaiQuyetDinh;
  let NgayBanHanh = data.ngayBanHanh || data.NgayBanHanh || data.ngayHieuLuc || data.NgayHieuLuc;

  if (
    QuyetDinhId &&
    QuyetDinhId !== "" &&
    QuyetDinhId !== "null" &&
    QuyetDinhId !== "undefined"
  ) {
    const qd = await decisionRepository.findById(QuyetDinhId, tx);
    if (qd) {
      return {
        id: qd.id || qd.Id,
        Id: qd.id || qd.Id,
        quyetDinhId: qd.id || qd.Id,
        QuyetDinhId: qd.id || qd.Id,
        soQuyetDinh: qd.soQuyetDinh || qd.SoQuyetDinh,
        SoQuyetDinh: qd.soQuyetDinh || qd.SoQuyetDinh,
        taiLieuUrl: qd.taiLieuUrl || qd.TaiLieuUrl || null,
        TaiLieuUrl: qd.taiLieuUrl || qd.TaiLieuUrl || null,
        taiLieuName: qd.taiLieuName || qd.TaiLieuName || null,
        TaiLieuName: qd.taiLieuName || qd.TaiLieuName || null,
      };
    }
  }

  if (SoQuyetDinh && SoQuyetDinh.trim() !== "") {
    let qd = await decisionRepository.findByDecisionNumber(SoQuyetDinh, tx);
    if (qd) {
      return {
        id: qd.id || qd.Id,
        Id: qd.id || qd.Id,
        quyetDinhId: qd.id || qd.Id,
        QuyetDinhId: qd.id || qd.Id,
        soQuyetDinh: qd.soQuyetDinh || qd.SoQuyetDinh,
        SoQuyetDinh: qd.soQuyetDinh || qd.SoQuyetDinh,
        taiLieuUrl: qd.taiLieuUrl || qd.TaiLieuUrl || null,
        TaiLieuUrl: qd.taiLieuUrl || qd.TaiLieuUrl || null,
        taiLieuName: qd.taiLieuName || qd.TaiLieuName || null,
        TaiLieuName: qd.taiLieuName || qd.TaiLieuName || null,
      };
    } else {
      const tempId = crypto.randomUUID();
      let qdTaiLieuUrl = null;
      let qdTaiLieuName = null;

      if (file) {
        const saved = await saveUploadFile(tempId, file);
        qdTaiLieuUrl = saved.fileUrl || saved.FileUrl;
        qdTaiLieuName = saved.fileName;
      }

      qd = await decisionRepository.create(
        {
          id: tempId,
          soQuyetDinh: SoQuyetDinh,
          tenQuyetDinh:
            TenQuyetDinh || `Quyết định số ${SoQuyetDinh}`,
          loaiQuyetDinh: loaiQD,
          ngayBanHanh: NgayBanHanh
            ? new Date(NgayBanHanh)
            : new Date(),
          taiLieuUrl: qdTaiLieuUrl,
          taiLieuName: qdTaiLieuName,
        },
        tx,
      );

      return {
        id: qd.id || qd.Id,
        Id: qd.id || qd.Id,
        quyetDinhId: qd.id || qd.Id,
        QuyetDinhId: qd.id || qd.Id,
        soQuyetDinh: qd.soQuyetDinh || qd.SoQuyetDinh,
        SoQuyetDinh: qd.soQuyetDinh || qd.SoQuyetDinh,
        taiLieuUrl: qd.taiLieuUrl || qd.TaiLieuUrl || null,
        TaiLieuUrl: qd.taiLieuUrl || qd.TaiLieuUrl || null,
        taiLieuName: qd.taiLieuName || qd.TaiLieuName || null,
        TaiLieuName: qd.taiLieuName || qd.TaiLieuName || null,
      };
    }
  }

  return {
    id: null,
    Id: null,
    quyetDinhId: null,
    QuyetDinhId: null,
    soQuyetDinh: null,
    SoQuyetDinh: null,
    taiLieuUrl: null,
    TaiLieuUrl: null,
    taiLieuName: null,
    TaiLieuName: null,
  };
};

module.exports = { resolveQuyetDinh };
