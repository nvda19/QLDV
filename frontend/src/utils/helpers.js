/**
 * Chuyển một chuỗi/giá trị ngày bất kỳ sang định dạng hiển thị DD/MM/YYYY.
 * Trả về dấu gạch ngang nếu đầu vào rỗng hoặc không parse được thành ngày hợp lệ.
 */
export function formatDate(dateStr) {
  if (!dateStr) return "—";
  const date = new Date(dateStr);
  if (isNaN(date.getTime())) return "—";
  const day = String(date.getDate()).padStart(2, "0");
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const year = date.getFullYear();
  return `${day}/${month}/${year}`;
}

/**
 * Tương tự formatDate nhưng chỉ hiển thị tháng/năm (MM/YYYY), dùng cho những
 * mốc thời gian không cần chính xác đến từng ngày (VD: ngày vào Đảng dự bị).
 */
export function formatMonthYear(dateStr) {
  if (!dateStr) return "—";
  const date = new Date(dateStr);
  if (isNaN(date.getTime())) return "—";
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const year = date.getFullYear();
  return `${month}/${year}`;
}

/**
 * Chuyển ngày sang định dạng YYYY-MM-DD để gán trực tiếp vào value của input[type="date"].
 */
export function formatDateForInput(dateStr) {
  if (!dateStr) return "";
  const date = new Date(dateStr);
  if (isNaN(date.getTime())) return "";
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

/**
 * Ghép danh sách tổ chức Đảng dạng phẳng thành cây phân cấp dựa vào parentId
 * của từng phần tử — dùng để hiển thị dạng cây trong dropdown chọn tổ chức.
 * @param {Array} orgs - Danh sách phẳng các tổ chức { id, name, parentId, ... }
 * @returns {Array} Cây tổ chức đã lồng nhau theo cấp cha - con
 */
export function buildOrgTree(orgs) {
  if (!orgs || orgs.length === 0) return [];

  const map = {};
  const roots = [];

  orgs.forEach((org) => {
    map[org.id] = { ...org, children: [] };
  });

  orgs.forEach((org) => {
    if (org.parentId && map[org.parentId]) {
      map[org.parentId].children.push(map[org.id]);
    } else {
      roots.push(map[org.id]);
    }
  });

  return roots;
}

/**
 * Ngược lại với buildOrgTree: duyệt cây tổ chức và trả về danh sách phẳng,
 * mỗi phần tử được gắn thêm 'level' (độ sâu) để component render thụt lề tương ứng.
 */
export function flattenOrgTree(tree, level = 0) {
  const result = [];
  tree.forEach((node) => {
    result.push({ ...node, level });
    if (node.children && node.children.length > 0) {
      result.push(...flattenOrgTree(node.children, level + 1));
    }
  });
  return result;
}

/**
 * Rút gọn họ tên thành 1-2 chữ cái viết hoa để hiển thị avatar mặc định.
 */
export function getInitials(name) {
  // Chặn cả trường hợp chuỗi rỗng lẫn chuỗi toàn khoảng trắng, nếu không sẽ bị lỗi truy cập undefined[0]
  if (!name || !name.trim()) return "?";
  const parts = name.trim().split(/\s+/);
  if (parts.length === 1) return parts[0][0].toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

/**
 * Ép trình duyệt tải file về máy từ dữ liệu blob nhận được (thường là kết quả
 * export Excel/Word từ backend), bằng cách tạo thẻ <a> ẩn rồi tự động click.
 */
export function downloadBlob(blob, filename) {
  const url = window.URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.setAttribute("download", filename);
  document.body.appendChild(link);
  link.click();
  link.remove();
  window.URL.revokeObjectURL(url);
}
