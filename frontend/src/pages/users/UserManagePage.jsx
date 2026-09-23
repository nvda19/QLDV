import { useState, useEffect, useRef } from 'react';
import {
  FiShield,
  FiPlus,
  FiEdit,
  FiTrash2,
  FiSave,
  FiX,
  FiLock,
  FiUnlock,
  FiKey,
  FiSearch,
  FiUser,
} from '../../components/icons';
import toast from 'react-hot-toast';
import { useAuth } from '../../contexts/AuthContext';
import { ROLES, ROLE_LABELS } from '../../utils/constants';
import userApi from '../../api/userApi';
import orgApi from '../../api/orgApi';
import memberApi from '../../api/memberApi';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import GlassSelect from '../../components/common/GlassSelect';
import GlassSearch from '../../components/common/GlassSearch';
import EmptyState from '../../components/common/EmptyState';
import ConfirmModal from '../../components/common/ConfirmModal';
import PageHeader from '../../components/common/PageHeader';

export default function UserManagePage() {
  const { user: currentUser } = useAuth();

  const [users, setUsers] = useState([]);
  const [orgs, setOrgs] = useState([]);
  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(true);

  // State cho các bộ lọc danh sách tài khoản
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [orgFilter, setOrgFilter] = useState('');

  // State cho modal thêm/sửa tài khoản
  const [showFormModal, setShowFormModal] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const [formData, setFormData] = useState({
    username: '',
    password: '',
    hoTen: '',
    role: ROLES.BI_THU,
    orgId: '',
  });
  const [formErrors, setFormErrors] = useState({});
  const [saving, setSaving] = useState(false);

  // State cho modal đặt lại mật khẩu
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [passwordTarget, setPasswordTarget] = useState(null);
  const [newPassword, setNewPassword] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [resettingPassword, setResettingPassword] = useState(false);

  // State cho modal xác nhận xóa tài khoản
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleting, setDeleting] = useState(false);

  const isMounted = useRef(false);

  useEffect(() => {
    fetchOrgs();
    fetchMembers();
  }, []);

  const fetchMembers = async () => {
    try {
      const res = await memberApi.getAll();
      setMembers(res.data || []);
    } catch {
      // ignore
    }
  };

  useEffect(() => {
    if (!isMounted.current) {
      isMounted.current = true;
      fetchUsers();
      return;
    }
    fetchUsers();
  }, [roleFilter, statusFilter, orgFilter]);

  useEffect(() => {
    if (!isMounted.current) return;
    const timer = setTimeout(() => {
      fetchUsers();
    }, 300);
    return () => clearTimeout(timer);
  }, [search]);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const params = {};
      if (search) params.search = search;
      if (roleFilter) params.role = roleFilter;
      if (statusFilter) params.status = statusFilter;
      if (orgFilter) params.orgId = orgFilter;

      const res = await userApi.getAll(params);
      setUsers(res.data || []);
    } catch {
      toast.error('Không thể tải danh sách tài khoản.');
    } finally {
      setLoading(false);
    }
  };

  const fetchOrgs = async () => {
    try {
      const res = await orgApi.getAll();
      setOrgs(res.data || []);
    } catch {
      toast.error('Không thể tải danh sách tổ chức.');
    }
  };

  const handleFilterSearch = (e) => {
    e.preventDefault();
    fetchUsers();
  };

  const handleClearFilters = () => {
    setSearch('');
    setRoleFilter('');
    setStatusFilter('');
    setOrgFilter('');
    // Gọi lại API ngay với tham số rỗng, không chờ effect chạy theo state
    setLoading(true);
    userApi.getAll()
      .then(res => setUsers(res.data || []))
      .catch(() => toast.error('Không thể tải danh sách tài khoản.'))
      .finally(() => setLoading(false));
  };

  const validatePassword = (password) => {
    if (!password || password.length < 8) return false;
    const hasUpper = /[A-Z]/.test(password);
    const hasLower = /[a-z]/.test(password);
    const hasDigit = /\d/.test(password);
    const hasSpecial = /[!@#$%^&*(),.?":{}|<>]/.test(password);
    return hasUpper && hasLower && hasDigit && hasSpecial;
  };

  // Không kiểm tra email vì hệ thống này không dùng email để đăng nhập

  const handleOpenAddModal = () => {
    setEditingUser(null);
    setFormData({
      username: '',
      password: '',
      hoTen: '',
      role: ROLES.BI_THU,
      orgId: '',
      dangVienId: '',
    });
    setFormErrors({});
    setShowFormModal(true);
  };

  const handleOpenEditModal = (u) => {
    setEditingUser(u);
    setFormData({
      username: u.username,
      password: '', // Không hiển thị mật khẩu cũ khi mở form sửa
      hoTen: u.hoTen,
      role: u.role,
      orgId: u.orgId || '',
      dangVienId: u.dangVienId || '',
    });
    setFormErrors({});
    setShowFormModal(true);
  };

  const handleFormSubmit = async (e) => {
    e.preventDefault();
    const errors = {};

    // Kiểm tra các trường bắt buộc cơ bản
    if (!editingUser && !formData.username.trim()) errors.username = 'Tên đăng nhập không được để trống.';
    if (!formData.hoTen.trim()) errors.hoTen = 'Họ tên không được để trống.';
    
    if (!editingUser) {
      if (!formData.password) {
        errors.password = 'Mật khẩu không được để trống.';
      } else if (!validatePassword(formData.password)) {
        errors.password = 'Mật khẩu tối thiểu 8 ký tự, gồm chữ hoa, chữ thường, số và ký tự đặc biệt.';
      }
    }

    if (formData.role === ROLES.BI_THU && !formData.orgId) {
      errors.orgId = 'Bí thư bắt buộc phải chọn một Tổ chức Đảng.';
    }

    if (formData.role === ROLES.DANG_VIEN && !formData.dangVienId) {
      errors.dangVienId = 'Đảng viên bắt buộc phải chọn một hồ sơ Đảng viên liên kết.';
    }

    if (Object.keys(errors).length > 0) {
      setFormErrors(errors);
      return;
    }

    setSaving(true);
    try {
      if (editingUser) {
        const payload = {
          hoTen: formData.hoTen.trim(),
          role: formData.role,
          orgId: formData.role === ROLES.CAN_BO_CHINH_TRI ? null : (formData.orgId || null),
          dangVienId: formData.role === ROLES.DANG_VIEN ? formData.dangVienId : null,
        };
        await userApi.update(editingUser.id, payload);
        toast.success('Cập nhật tài khoản thành công.');
      } else {
        const payload = {
          username: formData.username.trim(),
          password: formData.password,
          hoTen: formData.hoTen.trim(),
          role: formData.role,
          orgId: formData.role === ROLES.CAN_BO_CHINH_TRI ? null : (formData.orgId || null),
          dangVienId: formData.role === ROLES.DANG_VIEN ? formData.dangVienId : null,
        };
        await userApi.create(payload);
        toast.success('Tạo tài khoản thành công.');
      }
      setShowFormModal(false);
      fetchUsers();
    } catch (err) {
      toast.error(err.response?.data?.message || err.message || 'Có lỗi xảy ra.');
    } finally {
      setSaving(false);
    }
  };

  const handleOpenPasswordModal = (u) => {
    setPasswordTarget(u);
    setNewPassword('');
    setPasswordError('');
    setShowPasswordModal(true);
  };

  const handleResetPasswordSubmit = async (e) => {
    e.preventDefault();
    if (!validatePassword(newPassword)) {
      setPasswordError('Mật khẩu tối thiểu 8 ký tự, gồm chữ hoa, chữ thường, số và ký tự đặc biệt.');
      return;
    }

    setResettingPassword(true);
    try {
      await userApi.changePassword(passwordTarget.id, newPassword);
      toast.success(`Đã đổi mật khẩu cho tài khoản "${passwordTarget.username}" thành công.`);
      setShowPasswordModal(false);
    } catch (err) {
      toast.error(err.response?.data?.message || err.message || 'Có lỗi xảy ra.');
    } finally {
      setResettingPassword(false);
    }
  };

  const handleToggleStatus = async (u) => {
    if (u.id === currentUser.id) {
      toast.error('Bạn không thể tự khóa tài khoản của chính mình.');
      return;
    }

    const newStatus = u.status === 'ACTIVE' ? 'LOCKED' : 'ACTIVE';
    const actionLabel = newStatus === 'ACTIVE' ? 'mở khóa' : 'khóa';

    try {
      await userApi.update(u.id, { status: newStatus });
      toast.success(`Đã ${actionLabel} tài khoản "${u.username}".`);
      fetchUsers();
    } catch (err) {
      toast.error(err.response?.data?.message || err.message || 'Không thể thực hiện hành động này.');
    }
  };

  const handleDeleteSubmit = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await userApi.delete(deleteTarget.id);
      toast.success(`Đã xóa tài khoản "${deleteTarget.username}".`);
      fetchUsers();
    } catch (err) {
      toast.error(err.response?.data?.message || err.message || 'Không thể xóa tài khoản.');
    } finally {
      setDeleting(false);
      setDeleteTarget(null);
    }
  };

  const roleOptions = Object.keys(ROLES).map((key) => ({
    id: key,
    name: ROLE_LABELS[key],
  }));

  const statusOptions = [
    { id: 'ACTIVE', name: 'Hoạt động (Active)' },
    { id: 'LOCKED', name: 'Đang khóa (Locked)' },
  ];

  return (
    <div className="page">
      <PageHeader
        title="Quản lý tài khoản"
        actions={
          <button className="btn btn-primary" onClick={handleOpenAddModal}>
            Thêm tài khoản
          </button>
        }
      />

      {/* Khối bộ lọc: tìm kiếm, vai trò, trạng thái, tổ chức */}
      <div className="card" style={{ marginBottom: 'var(--spacing-lg)', position: 'relative', zIndex: 20 }}>
        <form onSubmit={handleFilterSearch} className="form-grid" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))' }}>
          <div className="form-group" style={{ marginBottom: 0 }}>
            <label className="form-label">Tìm kiếm</label>
            <GlassSearch
              placeholder="Tên đăng nhập, họ tên, email..."
              value={search}
              onChange={setSearch}
              width="100%"
            />
          </div>

          <div className="form-group" style={{ marginBottom: 0 }}>
            <label className="form-label">Vai trò</label>
            <GlassSelect
              value={roleFilter}
              onChange={setRoleFilter}
              options={roleOptions}
              placeholder="Tất cả vai trò"
              style={{ width: '100%' }}
            />
          </div>

          <div className="form-group" style={{ marginBottom: 0 }}>
            <label className="form-label">Trạng thái</label>
            <GlassSelect
              value={statusFilter}
              onChange={setStatusFilter}
              options={statusOptions}
              placeholder="Tất cả trạng thái"
              style={{ width: '100%' }}
            />
          </div>

          <div className="form-group" style={{ marginBottom: 0 }}>
            <label className="form-label">Tổ chức Đảng</label>
            <GlassSelect
              value={orgFilter}
              onChange={setOrgFilter}
              options={orgs}
              placeholder="Tất cả tổ chức"
              style={{ width: '100%' }}
            />
          </div>

          <div style={{ display: 'flex', alignItems: 'flex-end' }}>
            <button type="button" className="btn btn-outline" onClick={handleClearFilters} style={{ width: '100%', height: '38px', color: 'var(--color-text-muted)' }}>
              Xóa lọc
            </button>
          </div>
        </form>
      </div>

      {/* Bảng danh sách tài khoản người dùng */}
      <div className="card">
        <div className="card-header">
          <h3 className="card-title">Danh sách tài khoản hệ thống</h3>
          <span className="text-muted" style={{ fontSize: 'var(--font-size-sm)' }}>
            Tổng số: {users.length} người dùng
          </span>
        </div>

        {loading ? (
          <LoadingSpinner />
        ) : users.length === 0 ? (
          <EmptyState
            icon={FiUser}
            title="Không tìm thấy người dùng"
            message="Không có tài khoản nào phù hợp với bộ lọc tìm kiếm của bạn."
          />
        ) : (
          <div className="table-container">
            <table className="table">
              <thead>
                <tr>
                  <th>Họ và tên</th>
                  <th>Tên đăng nhập</th>
                  <th>Vai trò</th>
                  <th>Tổ chức sinh hoạt</th>
                  <th>Trạng thái</th>
                  <th style={{ textAlign: 'right' }}>Thao tác</th>
                </tr>
              </thead>
              <tbody>
                {users.map((u) => {
                  const isSelf = u.id === currentUser.id;
                  return (
                    <tr key={u.id} style={{ opacity: u.status === 'LOCKED' ? 0.7 : 1 }}>
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                          <div style={{
                            width: '32px',
                            height: '32px',
                            borderRadius: '50%',
                            background: u.role === ROLES.CAN_BO_CHINH_TRI ? 'rgba(30, 64, 175, 0.15)' : 'rgba(47, 58, 82, 0.5)',
                            color: u.role === ROLES.CAN_BO_CHINH_TRI ? 'var(--color-accent)' : 'var(--color-text)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontWeight: 'bold',
                            fontSize: '14px',
                            border: u.role === ROLES.CAN_BO_CHINH_TRI ? '1px solid rgba(30, 64, 175, 0.3)' : '1px solid rgba(47, 58, 82, 0.8)'
                          }}>
                            {u.hoTen ? u.hoTen.charAt(0).toUpperCase() : 'U'}
                          </div>
                          <div>
                            <span style={{ fontWeight: '600' }}>{u.hoTen}</span>
                            {isSelf && <span className="badge" style={{ marginLeft: '8px', background: 'rgba(30, 64, 175, 0.15)', color: 'var(--color-accent)', border: '1px solid rgba(30, 64, 175, 0.3)' }}>Bạn</span>}
                          </div>
                        </div>
                      </td>
                      <td style={{ fontFamily: 'monospace', fontSize: '13px' }}>{u.username}</td>
                      <td>
                        <span className={`badge ${u.role === ROLES.CAN_BO_CHINH_TRI ? 'success' : ''}`} style={{
                          background: u.role === ROLES.CAN_BO_CHINH_TRI ? 'rgba(30, 64, 175, 0.15)' : 'rgba(47, 58, 82, 0.5)',
                          color: u.role === ROLES.CAN_BO_CHINH_TRI ? 'var(--color-accent)' : 'var(--color-text-muted)',
                          border: u.role === ROLES.CAN_BO_CHINH_TRI ? '1px solid rgba(30, 64, 175, 0.3)' : '1px solid rgba(47, 58, 82, 0.6)'
                        }}>
                          {ROLE_LABELS[u.role] || u.role}
                        </span>
                      </td>
                      <td>{u.orgName || <span className="text-muted">—</span>}</td>
                      <td>
                        <span className={`badge ${u.status === 'ACTIVE' ? 'success' : 'danger'}`} style={{
                          background: u.status === 'ACTIVE' ? 'rgba(58, 143, 92, 0.2)' : 'rgba(196, 69, 69, 0.2)',
                          color: u.status === 'ACTIVE' ? '#3a8f5c' : '#c44545',
                          border: u.status === 'ACTIVE' ? '1px solid rgba(58, 143, 92, 0.4)' : '1px solid rgba(196, 69, 69, 0.4)'
                        }}>
                          {u.status === 'ACTIVE' ? 'Đang hoạt động' : 'Đã khóa'}
                        </span>
                      </td>
                      <td style={{ textAlign: 'right' }}>
                        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
                          <button
                            className="btn-icon"
                            title="Đổi mật khẩu"
                            onClick={() => handleOpenPasswordModal(u)}
                          >
                            <FiKey />
                          </button>
                          
                          <button
                            className="btn-icon"
                            title={u.status === 'ACTIVE' ? 'Khóa tài khoản' : 'Mở khóa tài khoản'}
                            onClick={() => handleToggleStatus(u)}
                            disabled={isSelf}
                            style={{ color: isSelf ? 'var(--color-text-muted)' : (u.status === 'ACTIVE' ? 'var(--color-warning)' : 'var(--color-accent)'), cursor: isSelf ? 'not-allowed' : 'pointer' }}
                          >
                            {u.status === 'ACTIVE' ? <FiLock /> : <FiUnlock />}
                          </button>

                          <button
                            className="btn-icon"
                            title="Sửa thông tin"
                            onClick={() => handleOpenEditModal(u)}
                          >
                            <FiEdit />
                          </button>

                          <button
                            className="btn-icon"
                            title="Xóa tài khoản"
                            onClick={() => setDeleteTarget(u)}
                            disabled={isSelf}
                            style={{ color: isSelf ? 'var(--color-text-muted)' : 'var(--color-error)', cursor: isSelf ? 'not-allowed' : 'pointer' }}
                          >
                            <FiTrash2 />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modal form thêm mới hoặc chỉnh sửa tài khoản */}
      {showFormModal && (
        <div className="modal-overlay" onClick={() => setShowFormModal(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '600px', width: '90%' }}>
            <div className="modal-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--spacing-lg)' }}>
              <h3 className="modal-title" style={{ margin: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
                <FiUser style={{ color: 'var(--color-accent)' }} />
                {editingUser ? 'Chỉnh sửa tài khoản' : 'Thêm tài khoản mới'}
              </h3>
              <button className="btn-icon" onClick={() => setShowFormModal(false)}>
                <FiX />
              </button>
            </div>
            
            <form onSubmit={handleFormSubmit}>
              <div className="form-grid" style={{ gridTemplateColumns: '1fr 1fr' }}>
                <div className="form-group" style={{ gridColumn: editingUser ? 'span 2' : 'span 1' }}>
                  <label className="form-label">Tên đăng nhập *</label>
                  <input
                    type="text"
                    className="form-input"
                    placeholder="Nhập tên đăng nhập"
                    value={formData.username}
                    onChange={(e) => setFormData((f) => ({ ...f, username: e.target.value }))}
                    disabled={!!editingUser}
                  />
                  {formErrors.username && <span style={{ color: 'var(--color-error)', fontSize: 'var(--font-size-xs)' }}>{formErrors.username}</span>}
                </div>

                {!editingUser && (
                  <div className="form-group">
                    <label className="form-label">Mật khẩu tạm thời *</label>
                    <input
                      type="password"
                      className="form-input"
                      placeholder="Nhập mật khẩu"
                      value={formData.password}
                      onChange={(e) => setFormData((f) => ({ ...f, password: e.target.value }))}
                    />
                    {formErrors.password && <span style={{ color: 'var(--color-error)', fontSize: 'var(--font-size-xs)' }}>{formErrors.password}</span>}
                  </div>
                )}

                <div className="form-group" style={{ gridColumn: 'span 2' }}>
                  <label className="form-label">Họ và tên *</label>
                  <input
                    type="text"
                    className="form-input"
                    placeholder="Nhập họ và tên đầy đủ"
                    value={formData.hoTen}
                    onChange={(e) => setFormData((f) => ({ ...f, hoTen: e.target.value }))}
                  />
                  {formErrors.hoTen && <span style={{ color: 'var(--color-error)', fontSize: 'var(--font-size-xs)' }}>{formErrors.hoTen}</span>}
                </div>

                <div className="form-group" style={{ gridColumn: formData.role === ROLES.DANG_VIEN ? 'span 2' : 'span 1' }}>
                  <label className="form-label">Vai trò</label>
                  <GlassSelect
                    value={formData.role}
                    onChange={(val) =>
                      setFormData((f) => ({
                        ...f,
                        role: val,
                        orgId: val === ROLES.CAN_BO_CHINH_TRI ? '' : f.orgId,
                        dangVienId: val === ROLES.DANG_VIEN ? f.dangVienId : '',
                      }))
                    }
                    options={Object.keys(ROLES).map((key) => ({ id: key, name: ROLE_LABELS[key] }))}
                    showEmptyOption={false}
                  />
                </div>

                {formData.role === ROLES.DANG_VIEN && (
                  <div className="form-group" style={{ gridColumn: 'span 2' }}>
                    <label className="form-label">Chọn hồ sơ Đảng viên liên kết *</label>
                    <GlassSelect
                      value={formData.dangVienId}
                      onChange={(val) => {
                        const m = members.find((mem) => mem.Id === val || mem.id === val);
                        setFormData((f) => ({
                          ...f,
                          dangVienId: val,
                          hoTen: m ? (m.HoTenDangDung || m.hoTen) : f.hoTen,
                          orgId: m ? (m.ToChucDangId || m.toChucDangId || f.orgId) : f.orgId,
                        }));
                      }}
                      options={members.map((m) => ({
                        id: m.Id || m.id,
                        name: `${m.HoTenDangDung || m.hoTen} - Số thẻ: ${m.SoTheDangVien || m.soTheDangVien || m.SoLyLich || 'Chưa có'} (${m.ToChucDang?.Ten || m.toChucDang?.ten || 'Chi bộ'})`,
                      }))}
                      placeholder="-- Chọn Đảng viên để liên kết tài khoản --"
                      disabled={!!editingUser}
                    />
                    {formErrors.dangVienId && (
                      <span style={{ color: 'var(--color-error)', fontSize: 'var(--font-size-xs)' }}>
                        {formErrors.dangVienId}
                      </span>
                    )}
                  </div>
                )}

                {formData.role !== ROLES.DANG_VIEN && (
                  <div className="form-group">
                    <label className="form-label">Tổ chức sinh hoạt {formData.role === ROLES.BI_THU && '*'}</label>
                    <GlassSelect
                      value={formData.orgId}
                      onChange={(val) => setFormData((f) => ({ ...f, orgId: val }))}
                      options={orgs.map((o) => ({ id: o.id, name: o.name }))}
                      placeholder="Chọn tổ chức Đảng"
                      disabled={formData.role === ROLES.CAN_BO_CHINH_TRI}
                    />
                    {formErrors.orgId && <span style={{ color: 'var(--color-error)', fontSize: 'var(--font-size-xs)' }}>{formErrors.orgId}</span>}
                  </div>
                )}
              </div>

              {!editingUser && (
                <div style={{
                  background: 'rgba(255, 255, 255, 0.03)',
                  border: '1px solid rgba(255, 255, 255, 0.08)',
                  borderRadius: '6px',
                  padding: 'var(--spacing-md)',
                  marginBottom: 'var(--spacing-lg)',
                  fontSize: 'var(--font-size-xs)',
                  color: 'var(--color-text-muted)'
                }}>
                  <strong style={{ color: 'var(--color-text)' }}>Yêu cầu mật khẩu:</strong>
                  <ul style={{ margin: '4px 0 0 16px', padding: 0 }}>
                    <li>Độ dài tối thiểu 8 ký tự</li>
                    <li>Chứa ít nhất 1 chữ hoa và 1 chữ thường</li>
                    <li>Chứa ít nhất 1 chữ số</li>
                    <li>Chứa ít nhất 1 ký tự đặc biệt (!@#$%^&...)</li>
                  </ul>
                </div>
              )}

              <div className="modal-actions" style={{ display: 'flex', justifyContent: 'flex-end', gap: 'var(--spacing-sm)', marginTop: 'var(--spacing-xl)' }}>
                <button
                  type="button"
                  className="btn btn-outline"
                  onClick={() => setShowFormModal(false)}
                  disabled={saving}
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  className="btn btn-primary"
                  disabled={saving}
                >
                  {saving ? 'Đang lưu...' : 'Lưu tài khoản'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal đặt lại mật khẩu cho tài khoản */}
      {showPasswordModal && (
        <div className="modal-overlay" onClick={() => setShowPasswordModal(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '450px', width: '90%' }}>
            <div className="modal-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--spacing-lg)' }}>
              <h3 className="modal-title" style={{ margin: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
                <FiKey style={{ color: 'var(--color-warning)' }} />
                Đổi mật khẩu tài khoản
              </h3>
              <button className="btn-icon" onClick={() => setShowPasswordModal(false)}>
                <FiX />
              </button>
            </div>
            
            <form onSubmit={handleResetPasswordSubmit}>
              <p style={{ margin: '0 0 var(--spacing-md) 0', color: 'var(--color-text-muted)', fontSize: 'var(--font-size-sm)' }}>
                Đổi mật khẩu cho tài khoản đăng nhập <strong style={{ color: 'var(--color-accent)' }}>{passwordTarget?.username}</strong> ({passwordTarget?.hoTen}).
              </p>

              <div className="form-group" style={{ marginBottom: 'var(--spacing-lg)' }}>
                <label className="form-label">Mật khẩu mới *</label>
                <input
                  type="password"
                  className="form-input"
                  placeholder="Nhập mật khẩu mới"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  autoFocus
                />
                {passwordError && <span style={{ color: 'var(--color-error)', fontSize: 'var(--font-size-xs)', marginTop: '4px', display: 'block' }}>{passwordError}</span>}
              </div>

              <div style={{
                background: 'rgba(255, 255, 255, 0.03)',
                border: '1px solid rgba(255, 255, 255, 0.08)',
                borderRadius: '6px',
                padding: 'var(--spacing-md)',
                marginBottom: 'var(--spacing-lg)',
                fontSize: 'var(--font-size-xs)',
                color: 'var(--color-text-muted)'
              }}>
                <strong style={{ color: 'var(--color-text)' }}>Yêu cầu mật khẩu:</strong>
                <ul style={{ margin: '4px 0 0 16px', padding: 0 }}>
                  <li>Độ dài tối thiểu 8 ký tự</li>
                  <li>Chứa ít nhất 1 chữ hoa, 1 chữ thường, 1 số và 1 ký tự đặc biệt</li>
                </ul>
              </div>

              <div className="modal-actions" style={{ display: 'flex', justifyContent: 'flex-end', gap: 'var(--spacing-sm)' }}>
                <button
                  type="button"
                  className="btn btn-outline"
                  onClick={() => setShowPasswordModal(false)}
                  disabled={resettingPassword}
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  className="btn btn-warning"
                  style={{ background: 'var(--color-warning)', color: '#0f172a' }}
                  disabled={resettingPassword}
                >
                  {resettingPassword ? 'Đang thực hiện...' : 'Xác nhận đổi'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal xác nhận trước khi xóa tài khoản */}
      <ConfirmModal
        isOpen={!!deleteTarget}
        title="Xóa tài khoản"
        message={`Bạn có chắc chắn muốn xóa tài khoản "${deleteTarget?.username}" (${deleteTarget?.hoTen}) khỏi hệ thống? Hành động này sẽ xóa vĩnh viễn và không thể khôi phục.`}
        confirmText="Xóa vĩnh viễn"
        onConfirm={handleDeleteSubmit}
        onCancel={() => setDeleteTarget(null)}
        loading={deleting}
        variant="danger"
      />
    </div>
  );
}
