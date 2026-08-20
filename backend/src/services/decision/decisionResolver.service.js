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
  let QuyetDinhId = data.QuyetDinhId;

  if (
    QuyetDinhId &&
    QuyetDinhId !== "" &&
    QuyetDinhId !== "null" &&
    QuyetDinhId !== "undefined"
  ) {
    const qd = await decisionRepository.findById(QuyetDinhId, tx);
    if (qd) {
      return {
        QuyetDinhId: qd.Id,
        SoQuyetDinh: qd.SoQuyetDinh,
        TaiLieuUrl: qd.TaiLieuUrl,
        TaiLieuName: qd.TaiLieuName,
      };
    }
  }

  if (data.SoQuyetDinh && data.SoQuyetDinh.trim() !== "") {
    let qd = await decisionRepository.findByDecisionNumber(data.SoQuyetDinh, tx);
    if (qd) {
      return {
        QuyetDinhId: qd.Id,
        SoQuyetDinh: qd.SoQuyetDinh,
        TaiLieuUrl: qd.TaiLieuUrl || null,
        TaiLieuName: qd.TaiLieuName || null,
      };
    } else {
      const tempId = crypto.randomUUID();
      let qdTaiLieuUrl = null;
      let qdTaiLieuName = null;

      if (file) {
        const saved = await saveUploadFile(tempId, file);
        qdTaiLieuUrl = saved.FileUrl;
        qdTaiLieuName = saved.fileName;
      }

      qd = await decisionRepository.create(
        {
          Id: tempId,
          SoQuyetDinh: data.SoQuyetDinh,
          TenQuyetDinh:
            data.TenQuyetDinh || `Quyết định số ${data.SoQuyetDinh}`,
          LoaiQuyetDinh: LoaiQuyetDinh,
          NgayBanHanh: data.NgayBanHanh
            ? new Date(data.NgayBanHanh)
            : data.NgayHieuLuc
              ? new Date(data.NgayHieuLuc)
              : new Date(),
          TaiLieuUrl: qdTaiLieuUrl,
          TaiLieuName: qdTaiLieuName,
        },
        tx,
      );

      return {
        QuyetDinhId: qd.Id,
        SoQuyetDinh: qd.SoQuyetDinh,
        TaiLieuUrl: qd.TaiLieuUrl,
        TaiLieuName: qd.TaiLieuName,
      };
    }
  }

  return {
    QuyetDinhId: null,
    SoQuyetDinh: null,
    TaiLieuUrl: null,
    TaiLieuName: null,
  };
};

module.exports = { resolveQuyetDinh };
