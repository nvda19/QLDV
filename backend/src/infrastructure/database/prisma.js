// Bọc basePrisma bằng $extends để mọi query CRUD tự động lo 2 việc: lọc soft-delete
// và ghi audit log - service/repository ở trên không cần biết gì về chuyện này.
// Cẩn thận: các hàm bên trong tự gọi getBaseModelAccessor(basePrisma, ...) để đọc dữ liệu
// gốc (trước khi update/delete), KHÔNG gọi qua prisma đã extend vì sẽ đệ quy vô hạn.
const { basePrisma } = require("./prisma.client");
const { getAuditContext } = require("../audit/auditContext");
const {
  AUDITED_MODELS,
  SOFT_DELETE_MODELS,
} = require("./extensions/modelConfig");
const {
  addSoftDeleteFilter,
  addSoftDeleteRelationFilter,
} = require("./extensions/softDelete");
const {
  computeDiff,
  sanitizeData,
  writeAuditLog,
  extractIdFromWhere,
  getBaseModelAccessor,
} = require("./extensions/auditWriter");

const prisma = basePrisma.$extends({
  query: {
    $allModels: {
      /**
       * Tìm bản ghi duy nhất
       * @param {*} model - Tên của model (Ví dụ: "user", "product")
       * @param {*} args - Tham số tìm kiếm (Ví dụ: { where: { id: 1 } })
       * @param {*} query - Hàm query gốc của Prisma
       * @returns
       */
      async findUnique({ model, args, query }) {
        if (SOFT_DELETE_MODELS.has(model)) {
          args.where = addSoftDeleteFilter(args.where);
          // Sau khi thêm DeletedAt: null, where không còn thỏa điều kiện "unique" bắt buộc
          // của findUnique nữa (Prisma sẽ throw validation error) nên phải đổi qua findFirst
          return getBaseModelAccessor(basePrisma, model).findFirst(args);
        }
        args.where = addSoftDeleteRelationFilter(model, args.where);
        return query(args);
      },

      /**
       * Tìm bản ghi đầu tiên
       * @param {*} model - Tên của model (Ví dụ: "user", "product")
       * @param {*} args - Tham số tìm kiếm (Ví dụ: { where: { id: 1 } })
       * @param {*} query - Hàm query gốc của Prisma
       * @returns
       */
      async findFirst({ model, args, query }) {
        if (SOFT_DELETE_MODELS.has(model)) {
          args.where = addSoftDeleteFilter(args.where);
        }
        args.where = addSoftDeleteRelationFilter(model, args.where);
        return query(args);
      },
      async findMany({ model, args, query }) {
        if (SOFT_DELETE_MODELS.has(model)) {
          args.where = addSoftDeleteFilter(args.where);
        }
        args.where = addSoftDeleteRelationFilter(model, args.where);
        return query(args);
      },

      /**
       * Tạo bản ghi mới
       * @param {*} model - Tên của model (Ví dụ: "user", "product")
       * @param {*} args - Tham số tạo bản ghi (Ví dụ: { data: { name: "John Doe", email: "[EMAIL_ADDRESS]" } })
       * @param {*} query - Hàm query gốc của Prisma
       * @returns
       */
      async create({ model, args, query }) {
        const { actorId, ipAddress } = getAuditContext();
        const result = await query(args);

        if (AUDITED_MODELS.has(model) && actorId) {
          const sanitized = sanitizeData(result);
          await writeAuditLog(
            basePrisma,
            actorId,
            "CREATE",
            model,
            result.Id || "unknown",
            null,
            sanitized,
            ipAddress,
          );
        }
        return result;
      },

      /**
       * Cập nhật bản ghi
       * @param {*} model - Tên của model (Ví dụ: "user", "product")
       * @param {*} args - Tham số cập nhật bản ghi (Ví dụ: { where: { id: 1 }, data: { name: "John Doe", email: "[EMAIL_ADDRESS]" } })
       * @param {*} query - Hàm query gốc của Prisma
       * @returns
       */
      async update({ model, args, query }) {
        const { actorId, ipAddress } = getAuditContext();
        let oldRecord = null;

        if (AUDITED_MODELS.has(model) && actorId) {
          try {
            // Phải đọc bản ghi cũ TRƯỚC khi update thì mới có gì để so sánh/diff
            const accessor = getBaseModelAccessor(basePrisma, model);
            oldRecord = await accessor.findUnique({ where: args.where });
          } catch (e) {
            // where không unique hoặc bản ghi không tồn tại - bỏ qua, không audit được thì thôi,
            // không được để lỗi ở bước này chặn update thật
          }
        }

        const result = await query(args);

        if (oldRecord && AUDITED_MODELS.has(model) && actorId) {
          const oldSanitized = sanitizeData(oldRecord);
          const newSanitized = sanitizeData(result);
          const diff = computeDiff(oldSanitized, newSanitized);
          if (diff) {
            await writeAuditLog(
              basePrisma,
              actorId,
              "UPDATE",
              model,
              result.Id || extractIdFromWhere(args.where),
              diff.oldDiff,
              diff.newDiff,
              ipAddress,
            );
          }
        }
        return result;
      },

      /**
       * Tạo hoặc cập nhật bản ghi
       * @param {*} model - Tên của model (Ví dụ: "user", "product")
       * @param {*} args - Tham số tạo hoặc cập nhật bản ghi (Ví dụ: { where: { id: 1 }, create: { name: "John Doe" }, update: { name: "John Doe" } })
       * @param {*} query - Hàm query gốc của Prisma
       * @returns
       */
      async upsert({ model, args, query }) {
        const { actorId, ipAddress } = getAuditContext();
        let existingRecord = null;

        if (AUDITED_MODELS.has(model) && actorId) {
          try {
            // Check trước xem bản ghi đã tồn tại chưa để biết log là CREATE hay UPDATE
            const accessor = getBaseModelAccessor(basePrisma, model);
            existingRecord = await accessor.findUnique({ where: args.where });
          } catch (e) {
            // ignore
          }
        }

        const result = await query(args);

        if (AUDITED_MODELS.has(model) && actorId) {
          const newSanitized = sanitizeData(result);
          if (existingRecord) {
            const oldSanitized = sanitizeData(existingRecord);
            const diff = computeDiff(oldSanitized, newSanitized);
            if (diff) {
              await writeAuditLog(
                basePrisma,
                actorId,
                "UPDATE",
                model,
                result.Id || extractIdFromWhere(args.where),
                diff.oldDiff,
                diff.newDiff,
                ipAddress,
              );
            }
          } else {
            await writeAuditLog(
              basePrisma,
              actorId,
              "CREATE",
              model,
              result.Id || "unknown",
              null,
              newSanitized,
              ipAddress,
            );
          }
        }
        return result;
      },

      /**
       * Xóa bản ghi
       * @param {*} model - Tên của model (Ví dụ: "user", "product")
       * @param {*} args - Tham số xóa bản ghi (Ví dụ: { where: { id: 1 } })
       * @param {*} query - Hàm query gốc của Prisma
       * @returns
       */
      async delete({ model, args, query }) {
        const { actorId, ipAddress } = getAuditContext();
        let oldRecord = null;

        if (AUDITED_MODELS.has(model) && actorId) {
          try {
            const accessor = getBaseModelAccessor(basePrisma, model);
            oldRecord = await accessor.findUnique({ where: args.where });
          } catch (e) {
            // ignore
          }
        }

        let result;
        if (SOFT_DELETE_MODELS.has(model)) {
          // "Xóa" ở đây thực chất là update DeletedAt/DeletedBy, không đụng tới query() gốc
          // (nếu không sẽ xóa thật khỏi DB, mất luôn dữ liệu cần giữ để tra cứu lịch sử)
          const accessor = getBaseModelAccessor(basePrisma, model);
          result = await accessor.update({
            where: args.where,
            data: { DeletedAt: new Date(), DeletedBy: actorId || "system" },
          });
        } else {
          result = await query(args);
        }

        if (oldRecord && AUDITED_MODELS.has(model) && actorId) {
          const oldSanitized = sanitizeData(oldRecord);
          const actionName = SOFT_DELETE_MODELS.has(model)
            ? "SOFT_DELETE"
            : "DELETE";
          await writeAuditLog(
            basePrisma,
            actorId,
            actionName,
            model,
            result.Id || extractIdFromWhere(args.where),
            oldSanitized,
            null,
            ipAddress,
          );
        }
        return result;
      },

      /**
       * Xóa nhiều bản ghi
       * @param {*} model - Tên của model (Ví dụ: "user", "product")
       * @param {*} args - Tham số xóa nhiều bản ghi (Ví dụ: { where: { id: { in: [1, 2, 3] } } })
       * @param {*} query - Hàm query gốc của Prisma
       * @returns
       */
      async deleteMany({ model, args, query }) {
        const { actorId, ipAddress } = getAuditContext();
        let affectedRecords = [];

        if (AUDITED_MODELS.has(model) && actorId) {
          try {
            // Lấy trước danh sách bản ghi sẽ bị ảnh hưởng - sau khi deleteMany chạy xong
            // thì không còn cách nào biết những dòng nào đã bị xóa/soft-delete nữa
            const accessor = getBaseModelAccessor(basePrisma, model);
            affectedRecords = await accessor.findMany({ where: args.where });
          } catch (e) {
            // ignore
          }
        }

        let result;
        if (SOFT_DELETE_MODELS.has(model)) {
          const accessor = getBaseModelAccessor(basePrisma, model);
          result = await accessor.updateMany({
            where: args.where,
            data: { DeletedAt: new Date(), DeletedBy: actorId || "system" },
          });
        } else {
          result = await query(args);
        }

        if (
          affectedRecords.length > 0 &&
          AUDITED_MODELS.has(model) &&
          actorId
        ) {
          const ids = affectedRecords.map((r) => r.Id).filter(Boolean);
          const actionName = SOFT_DELETE_MODELS.has(model)
            ? "SOFT_DELETE"
            : "DELETE";
          await writeAuditLog(
            basePrisma,
            actorId,
            actionName,
            model,
            ids.join(",") || "batch",
            {
              count: affectedRecords.length,
              ids,
              records: affectedRecords.map((r) => sanitizeData(r)),
            },
            null,
            ipAddress,
          );
        }
        return result;
      },
    },
  },
});

module.exports = prisma;
