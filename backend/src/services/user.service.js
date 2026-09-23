const userRepository = require("../repositories/user.repository");
const orgRepository = require("../repositories/org.repository");
const memberRepository = require("../repositories/member/member.repository");
const prisma = require("../infrastructure/database/prisma");
const bcrypt = require("bcryptjs");
const { ROLES } = require("../domain/constants/member.constants");

/**
 * Kiểm tra mật khẩu có đạt yêu cầu tối thiểu (độ dài, hoa/thường, số, ký tự đặc biệt).
 * @param {string} password
 * @returns {boolean}
 */
const validatePassword = (password) => {
  if (!password || password.length < 8) return false;
  const hasUpper = /[A-Z]/.test(password);
  const hasLower = /[a-z]/.test(password);
  const hasDigit = /\d/.test(password);
  const hasSpecial = /[!@#$%^&*(),.?":{}|<>]/.test(password);
  return hasUpper && hasLower && hasDigit && hasSpecial;
};

/**
 * Lấy danh sách tài khoản người dùng theo bộ lọc.
 * @param {Object} filters
 * @returns {Promise<Array<Object>>}
 */
const getAllUsers = async (filters = {}) => {
  const users = await userRepository.findAll(filters);

  return users.map((u) => {
    const dv = u.DangVien || u.dangVien;
    const ll = dv?.LyLichCaNhan || dv?.lyLichCaNhan;
    return {
      id: u.Id,
      username: u.TenDangNhap,
      hoTen: u.HoTen,
      role: u.VaiTro,
      orgId: u.ToChucDangId,
      orgName: u.ToChucDang ? u.ToChucDang.Ten : null,
      dangVienId: u.DangVienId || u.dangVienId || null,
      dangVien: dv ? {
        id: dv.Id || dv.id,
        soTheDangVien: dv.SoTheDangVien || dv.soTheDangVien,
        hoTen: ll?.HoTenDangDung || ll?.hoTenDangDung || null,
      } : null,
      status: u.TrangThai,
      createdAt: u.CreatedAt,
    };
  });
};

/**
 * Tạo tài khoản người dùng mới (Bí thư/Cán bộ chính trị/Đảng viên).
 * @param {Object} userData
 * @returns {Promise<Object>}
 */
const createUser = async (userData) => {
  const { username, password, hoTen, role, orgId, dangVienId } = userData;

  let resolvedOrgId = orgId || null;
  let resolvedHoTen = hoTen;
  let resolvedDangVienId = null;

  // Ràng buộc vai trò Đảng viên: Bắt buộc gắn với 1 hồ sơ Đảng viên
  if (role === ROLES.DANG_VIEN) {
    if (!dangVienId) {
      throw new Error("Tài khoản Đảng viên bắt buộc phải liên kết với một hồ sơ Đảng viên.");
    }
    const member = await memberRepository.findById(dangVienId);
    if (!member) {
      throw new Error("Hồ sơ Đảng viên không tồn tại.");
    }
    const existingLinked = await userRepository.findByMemberId(dangVienId);
    if (existingLinked) {
      throw new Error("Hồ sơ Đảng viên này đã có tài khoản người dùng.");
    }
    resolvedDangVienId = dangVienId;
    resolvedOrgId = resolvedOrgId || member.ToChucDangId || member.toChucDangId || null;
    resolvedHoTen = hoTen || member.LyLichCaNhan?.HoTenDangDung || member.lyLichCaNhan?.hoTenDangDung || member.HoTenDangDung || member.hoTen;
  }

  if (!username || !password || !resolvedHoTen || !role) {
    throw new Error(
      "Vui lòng nhập đầy đủ các trường bắt buộc (Username, Password, Họ tên, Vai trò).",
    );
  }

  if (!validatePassword(password)) {
    throw new Error(
      "Mật khẩu phải có độ dài tối thiểu 8 ký tự, bao gồm chữ hoa, chữ thường, số và ký tự đặc biệt.",
    );
  }

  const existingUsername = await userRepository.findByUsername(username);
  if (existingUsername) {
    throw new Error("Username đã được sử dụng.");
  }

  // Ràng buộc Bí thư chi bộ phải đi kèm một Tổ chức Đảng
  if (role === ROLES.BI_THU && !resolvedOrgId) {
    throw new Error("Bí thư bắt buộc phải được gắn với một Tổ chức Đảng.");
  }

  if (resolvedOrgId) {
    const org = await orgRepository.findById(resolvedOrgId);
    if (!org) {
      throw new Error("Tổ chức Đảng không tồn tại.");
    }
  }

  const matKhauHash = await bcrypt.hash(password, 10);

  const newUser = await userRepository.create({
    TenDangNhap: username,
    MatKhauHash: matKhauHash,
    HoTen: resolvedHoTen,
    VaiTro: role,
    ToChucDangId: resolvedOrgId,
    DangVienId: resolvedDangVienId,
    TrangThai: "ACTIVE",
  });

  return {
    id: newUser.Id,
    username: newUser.TenDangNhap,
    hoTen: newUser.HoTen,
    role: newUser.VaiTro,
    orgId: newUser.ToChucDangId,
    dangVienId: newUser.DangVienId || newUser.dangVienId,
    orgName: newUser.ToChucDang ? newUser.ToChucDang.Ten : null,
    status: newUser.TrangThai,
    createdAt: newUser.CreatedAt,
  };
};

/**
 * Cập nhật tài khoản người dùng.
 * @param {string} id
 * @param {Object} userData
 * @param {string} currentUserId
 * @returns {Promise<Object>}
 */
const updateUser = async (id, userData, currentUserId) => {
  const { hoTen, role, orgId, status, dangVienId } = userData;

  const existingUser = await userRepository.findById(id);
  if (!existingUser) {
    throw new Error("Không tìm thấy tài khoản người dùng.");
  }

  if (id === currentUserId && status === "LOCKED") {
    throw new Error("Bạn không thể khóa tài khoản của chính mình.");
  }

  // Ghép giá trị mới với giá trị cũ để kiểm tra ràng buộc trên trạng thái sau khi cập nhật
  const targetRole = role || existingUser.VaiTro;
  let targetOrgId = orgId !== undefined ? orgId : existingUser.ToChucDangId;
  let targetDangVienId = dangVienId !== undefined ? dangVienId : (existingUser.DangVienId || existingUser.dangVienId);

  if (targetRole === ROLES.DANG_VIEN) {
    if (!targetDangVienId) {
      throw new Error("Tài khoản Đảng viên bắt buộc phải liên kết với một hồ sơ Đảng viên.");
    }
    const member = await memberRepository.findById(targetDangVienId);
    if (!member) {
      throw new Error("Hồ sơ Đảng viên được chọn không tồn tại.");
    }
    const existingLinked = await prisma.nguoiDung.findFirst({
      where: {
        dangVienId: targetDangVienId,
        id: { not: id },
      },
    });
    if (existingLinked) {
      throw new Error("Hồ sơ Đảng viên này đã được liên kết với một tài khoản khác.");
    }
    targetOrgId = targetOrgId || member.ToChucDangId || member.toChucDangId || null;
  }

  if (targetRole === ROLES.BI_THU && !targetOrgId) {
    throw new Error("Bí thư bắt buộc phải được gắn với một Tổ chức Đảng.");
  }

  if (targetOrgId) {
    const org = await orgRepository.findById(targetOrgId);
    if (!org) {
      throw new Error("Tổ chức Đảng không tồn tại.");
    }
  }

  const updated = await userRepository.update(id, {
    HoTen: hoTen !== undefined ? hoTen : existingUser.HoTen,
    VaiTro: role !== undefined ? role : existingUser.VaiTro,
    ToChucDangId:
      orgId !== undefined ? orgId || null : existingUser.ToChucDangId,
    DangVienId:
      dangVienId !== undefined ? dangVienId || null : undefined,
    TrangThai: status !== undefined ? status : existingUser.TrangThai,
  });

  return {
    id: updated.Id,
    username: updated.TenDangNhap,
    hoTen: updated.HoTen,
    role: updated.VaiTro,
    orgId: updated.ToChucDangId,
    dangVienId: updated.DangVienId || updated.dangVienId,
    orgName: updated.ToChucDang ? updated.ToChucDang.Ten : null,
    status: updated.TrangThai,
    createdAt: updated.CreatedAt,
  };
};

/**
 * Đặt lại mật khẩu cho một tài khoản khác (do admin/cán bộ chính trị thực hiện —
 * khác với `auth.service.changePassword` là người dùng tự đổi mật khẩu của chính mình).
 * @param {string} id
 * @param {string} newPassword
 * @returns {Promise<boolean>}
 */
const changePassword = async (id, newPassword) => {
  const existingUser = await userRepository.findById(id);
  if (!existingUser) {
    throw new Error("Không tìm thấy tài khoản người dùng.");
  }

  if (!validatePassword(newPassword)) {
    throw new Error(
      "Mật khẩu phải có độ dài tối thiểu 8 ký tự, bao gồm chữ hoa, chữ thường, số và ký tự đặc biệt.",
    );
  }

  const matKhauHash = await bcrypt.hash(newPassword, 10);
  await userRepository.update(id, { MatKhauHash: matKhauHash });
  return true;
};

/**
 * Xóa tài khoản người dùng.
 * @param {string} id
 * @param {string} currentUserId
 * @returns {Promise<boolean>}
 */
const deleteUser = async (id, currentUserId) => {
  const existingUser = await userRepository.findById(id);
  if (!existingUser) {
    throw new Error("Không tìm thấy tài khoản người dùng.");
  }

  if (id === currentUserId) {
    throw new Error("Bạn không thể tự xóa tài khoản của chính mình.");
  }

  await userRepository.delete(id);
  return true;
};

module.exports = {
  getAllUsers,
  createUser,
  updateUser,
  changePassword,
  deleteUser,
};
