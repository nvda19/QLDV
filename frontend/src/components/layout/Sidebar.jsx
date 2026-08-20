import { NavLink } from 'react-router-dom';
import {
  FiGrid,
  FiUsers,
  FiLayers,
  FiShield,
  FiBarChart2,
  FiAward,
  FiCheckSquare,
  FiBriefcase,
  FiActivity,
  FiBell,
  FiFileText,
} from '../icons';
import { useAuth } from '../../contexts/AuthContext';
import { ROLES, ROLE_LABELS } from '../../utils/constants';
import { useNotifications } from '../../contexts/NotificationContext';

export default function Sidebar() {
  const { user } = useAuth();
  const { unreadCount } = useNotifications();

  return (
    <aside className="sidebar">
      <nav className="sidebar-nav">
        <div className="sidebar-section">
          <div className="sidebar-section-title">Tổng quan</div>
        </div>

        <NavLink
          to="/"
          end
          title="Bảng điều khiển"
          className={({ isActive }) =>
            `sidebar-link ${isActive ? 'active' : ''}`
          }
        >
          <span className="sidebar-icon-box">
            <FiGrid className="icon" />
          </span>
          <span className="sidebar-link-text">Bảng điều khiển</span>
        </NavLink>

        <NavLink
          to="/notifications"
          title="Thông báo"
          className={({ isActive }) =>
            `sidebar-link ${isActive ? 'active' : ''}`
          }
        >
          <span className="sidebar-icon-box">
            <FiBell className="icon" />
            {unreadCount > 0 && (
              <span className="sidebar-icon-badge">
                {unreadCount > 99 ? '99+' : unreadCount}
              </span>
            )}
          </span>
          <span className="sidebar-link-text">
            Thông báo
            {unreadCount > 0 && (
              <span className="sidebar-text-badge">
                {unreadCount > 99 ? '99+' : unreadCount}
              </span>
            )}
          </span>
        </NavLink>

        <div className="sidebar-section">
          <div className="sidebar-section-title">Quản lý</div>
        </div>

        <NavLink
          to="/members"
          title="Đảng viên"
          className={({ isActive }) =>
            `sidebar-link ${isActive ? 'active' : ''}`
          }
        >
          <span className="sidebar-icon-box">
            <FiUsers className="icon" />
          </span>
          <span className="sidebar-link-text">Đảng viên</span>
        </NavLink>

        <NavLink
          to="/organizations"
          title="Tổ chức Đảng"
          className={({ isActive }) =>
            `sidebar-link ${isActive ? 'active' : ''}`
          }
        >
          <span className="sidebar-icon-box">
            <FiLayers className="icon" />
          </span>
          <span className="sidebar-link-text">Tổ chức Đảng</span>
        </NavLink>

        <div className="sidebar-section">
          <div className="sidebar-section-title">Báo cáo & Thống kê</div>
        </div>

        <NavLink
          to="/statistics/members"
          title="Thống kê Đảng viên"
          className={({ isActive }) =>
            `sidebar-link ${isActive ? 'active' : ''}`
          }
        >
          <span className="sidebar-icon-box">
            <FiBarChart2 className="icon" />
          </span>
          <span className="sidebar-link-text">Thống kê Đảng viên</span>
        </NavLink>

        {user?.role === ROLES.CAN_BO_CHINH_TRI && (
          <NavLink
            to="/statistics/committee"
            title="Thống kê Cấp ủy"
            className={({ isActive }) =>
              `sidebar-link ${isActive ? 'active' : ''}`
            }
          >
            <span className="sidebar-icon-box">
              <FiBriefcase className="icon" />
            </span>
            <span className="sidebar-link-text">Thống kê Cấp ủy</span>
          </NavLink>
        )}

        <NavLink
          to="/statistics/activity"
          title="Thống kê hoạt động"
          className={({ isActive }) =>
            `sidebar-link ${isActive ? 'active' : ''}`
          }
        >
          <span className="sidebar-icon-box">
            <FiActivity className="icon" />
          </span>
          <span className="sidebar-link-text">Thống kê hoạt động</span>
        </NavLink>

        <div className="sidebar-section">
          <div className="sidebar-section-title">Nghiệp vụ Đảng</div>
        </div>

        <NavLink
          to="/evaluations"
          title="Xếp loại hàng năm"
          className={({ isActive }) =>
            `sidebar-link ${isActive ? 'active' : ''}`
          }
        >
          <span className="sidebar-icon-box">
            <FiCheckSquare className="icon" />
          </span>
          <span className="sidebar-link-text">Xếp loại hàng năm</span>
        </NavLink>

        <NavLink
          to="/badges"
          title="Xét tặng Huy hiệu"
          className={({ isActive }) =>
            `sidebar-link ${isActive ? 'active' : ''}`
          }
        >
          <span className="sidebar-icon-box">
            <FiAward className="icon" />
          </span>
          <span className="sidebar-link-text">Xét tặng Huy hiệu</span>
        </NavLink>

        <NavLink
          to="/decisions"
          title="Quản lý Quyết định"
          className={({ isActive }) =>
            `sidebar-link ${isActive ? 'active' : ''}`
          }
        >
          <span className="sidebar-icon-box">
            <FiFileText className="icon" />
          </span>
          <span className="sidebar-link-text">Quản lý Quyết định</span>
        </NavLink>

        {user?.role === ROLES.CAN_BO_CHINH_TRI && (
          <>
            <div className="sidebar-section">
              <div className="sidebar-section-title">Hệ thống</div>
            </div>
            <NavLink
              to="/users"
              title="Quản lý tài khoản"
              className={({ isActive }) =>
                `sidebar-link ${isActive ? 'active' : ''}`
              }
            >
              <span className="sidebar-icon-box">
                <FiShield className="icon" />
              </span>
              <span className="sidebar-link-text">Quản lý tài khoản</span>
            </NavLink>
          </>
        )}
      </nav>

      <div className="sidebar-footer">
        <div
          style={{
            fontSize: 'var(--font-size-xs)',
            color: 'var(--color-text-muted)',
            whiteSpace: 'nowrap',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
          }}
        >
          Vai trò:{' '}
          <span style={{ color: 'var(--color-accent)', fontWeight: 600 }}>
            {user ? ROLE_LABELS[user.role] || user.role : ''}
          </span>
        </div>
      </div>
    </aside>
  );
}
