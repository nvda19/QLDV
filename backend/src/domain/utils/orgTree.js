/**
 * Duyệt đệ quy để lấy toàn bộ ID các tổ chức con cháu (mọi cấp) của một tổ chức, kể cả chính nó.
 * `orgs` cần truyền cả cây (không phải chỉ một cấp) vì hàm tự đệ quy xuống các cấp dưới.
 * @param {Array<Object>} orgs Mảng chứa toàn bộ các tổ chức Đảng
 * @param {number} rootId ID của tổ chức gốc
 * @returns {Array<number>} Mảng ID của tổ chức gốc và tất cả tổ chức con cháu
 */
const getDescendantOrgIds = (orgs, rootId) => {
  const ids = [rootId];
  const collect = (ToChucChaId) => {
    orgs.forEach((o) => {
      // Chấp nhận cả ToChucChaId lẫn ParentId vì dữ liệu truyền vào có lúc lấy thẳng
      // từ Prisma (ToChucChaId), có lúc đã qua mapper (ParentId)
      const parentId =
        o.ToChucChaId !== undefined
          ? o.ToChucChaId
          : o.ParentId !== undefined
            ? o.ParentId
            : undefined;
      if (parentId === ToChucChaId) {
        const id = o.Id || o.id;
        ids.push(id);
        collect(id);
      }
    });
  };
  collect(rootId);
  return ids;
};

module.exports = { getDescendantOrgIds };
