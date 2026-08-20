import { Navigate, useLocation } from 'react-router-dom';
import { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import LoadingSpinner from './common/LoadingSpinner';
import { FiCheck } from './icons';
import toast from 'react-hot-toast';

const PASSWORD_RULES = [
  { key: 'length', label: 'Có độ dài tối thiểu 8 ký tự', test: (v) => v.length >= 8 },
  { key: 'upper', label: 'Chứa ít nhất 1 chữ cái viết hoa (A-Z)', test: (v) => /[A-Z]/.test(v) },
  { key: 'lower', label: 'Chứa ít nhất 1 chữ cái viết thường (a-z)', test: (v) => /[a-z]/.test(v) },
  { key: 'digit', label: 'Chứa ít nhất 1 chữ số (0-9)', test: (v) => /\d/.test(v) },
  { key: 'special', label: 'Chứa ít nhất 1 ký tự đặc biệt (!@#...)', test: (v) => /[!@#$%^&*(),.?":{}|<>]/.test(v) },
];

function ForceChangePassword() {
  const { changePassword, logout } = useAuth();
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!newPassword || !confirmPassword) {
      toast.error('Vui lòng điền đầy đủ thông tin');
      return;
    }
    if (newPassword !== confirmPassword) {
      toast.error('Xác nhận mật khẩu không khớp');
      return;
    }
    if (!PASSWORD_RULES.every((rule) => rule.test(newPassword))) {
      toast.error('Mật khẩu chưa đủ mạnh');
      return;
    }

    try {
      setSubmitting(true);
      await changePassword(newPassword);
      toast.success('Đổi mật khẩu thành công! Hệ thống đã mở khóa.');
    } catch (err) {
      toast.error(err.response?.data?.message || err.message || 'Có lỗi xảy ra');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="login-page">
      <div className="login-card">
        <div className="login-header">
          <div className="login-logo">
            <img src="/logo.png" alt="Logo Đảng Cộng sản Việt Nam" />
          </div>
          <h1 className="login-title">Đổi mật khẩu lần đầu</h1>
          <p className="login-subtitle">
            Để bảo mật an toàn thông tin Đảng vụ, bạn bắt buộc phải thay đổi mật khẩu mặc định
            trước khi sử dụng hệ thống.
          </p>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label" htmlFor="newPassword">Mật khẩu mới</label>
            <input
              id="newPassword"
              type="password"
              className="form-input"
              placeholder="Nhập mật khẩu mới"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              disabled={submitting}
              autoFocus
            />
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="confirmPassword">Xác nhận mật khẩu mới</label>
            <input
              id="confirmPassword"
              type="password"
              className="form-input"
              placeholder="Nhập lại mật khẩu mới"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              disabled={submitting}
            />
          </div>

          <div className="password-requirements">
            <strong>Yêu cầu mật khẩu mạnh:</strong>
            <ul>
              {PASSWORD_RULES.map((rule) => (
                <li key={rule.key} className={rule.test(newPassword) ? 'valid' : ''}>
                  <FiCheck /> {rule.label}
                </li>
              ))}
            </ul>
          </div>

          <button type="submit" className="btn btn-accent login-btn" disabled={submitting}>
            {submitting ? 'Đang cập nhật...' : 'Cập nhật & Vào hệ thống'}
          </button>

          <button type="button" className="btn btn-outline login-btn" onClick={logout}>
            Quay lại đăng nhập
          </button>
        </form>
      </div>
    </div>
  );
}

export default function ProtectedRoute({ children }) {
  const { isAuthenticated, user, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return <LoadingSpinner />;
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (user?.mustChangePassword) {
    return <ForceChangePassword />;
  }

  return children;
}
