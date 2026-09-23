import { NavLink } from "react-router-dom";
import {
  FiGrid,
  FiUser,
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
} from "../icons";
import { useAuth } from "../../contexts/AuthContext";
import { ROLES, ROLE_LABELS } from "../../utils/constants";
import { useNotifications } from "../../contexts/NotificationContext";

export default function Sidebar() {
  const { user } = useAuth();
  const { unreadCount } = useNotifications();
  const isDangVien = user?.role === ROLES.DANG_VIEN;
  const memberProfilePath = user?.memberId ? `/members/${user.memberId}` : "/members";

  return (
    <aside className="sidebar" aria-label="Điều hướng chính">
      <nav className="sidebar-nav">
        <div className="sidebar-section">
          <div className="sidebar-section-title">Tổng quan</div>
        </div>

        <NavLink
          to="/"
          end
          aria-label="Bảng điều khiển"
          className={({ isActive }) =>
            `sidebar-link ${isActive ? "active" : ""}`
          }
        >
          <span className="sidebar-icon-box">
            <FiGrid className="icon" />
          </span>
          <span className="sidebar-tooltip">Bảng điều khiển</span>
        </NavLink>

        <NavLink
          to="/notifications"
          aria-label="Thông báo"
          className={({ isActive }) =>
            `sidebar-link ${isActive ? "active" : ""}`
          }
        >
          <span className="sidebar-icon-box">
            <FiBell className="icon" />
            {unreadCount > 0 && (
              <span className="sidebar-icon-badge">
                {unreadCount > 99 ? "99+" : unreadCount}
              </span>
            )}
          </span>
          <span className="sidebar-tooltip">
            Thông báo
            {unreadCount > 0 && (
              <span className="sidebar-tooltip-badge">
                {unreadCount > 99 ? "99+" : unreadCount}
              </span>
            )}
          </span>
        </NavLink>

        {isDangVien ? (
          <>
            <div className="sidebar-section">
              <div className="sidebar-section-title">Cá nhân</div>
            </div>

            <NavLink
              to={memberProfilePath}
              aria-label="Hồ sơ cá nhân"
              className={({ isActive }) =>
                `sidebar-link ${isActive ? "active" : ""}`
              }
            >
              <span className="sidebar-icon-box">
                <FiUser className="icon" />
              </span>
              <span className="sidebar-tooltip">Hồ sơ của tôi</span>
            </NavLink>

            <NavLink
              to="/decisions"
              aria-label="Văn bản & Quyết định"
              className={({ isActive }) =>
                `sidebar-link ${isActive ? "active" : ""}`
              }
            >
              <span className="sidebar-icon-box">
                <FiFileText className="icon" />
              </span>
              <span className="sidebar-tooltip">Văn bản & Quyết định</span>
            </NavLink>
          </>
        ) : (
          <>
            <div className="sidebar-section">
              <div className="sidebar-section-title">Quản lý</div>
            </div>

            <NavLink
              to="/members"
              aria-label="Đảng viên"
              className={({ isActive }) =>
                `sidebar-link ${isActive ? "active" : ""}`
              }
            >
              <span className="sidebar-icon-box">
                <FiUsers className="icon" />
              </span>
              <span className="sidebar-tooltip">Đảng viên</span>
            </NavLink>

            <NavLink
              to="/organizations"
              aria-label="Tổ chức Đảng"
              className={({ isActive }) =>
                `sidebar-link ${isActive ? "active" : ""}`
              }
            >
              <span className="sidebar-icon-box">
                <FiLayers className="icon" />
              </span>
              <span className="sidebar-tooltip">Tổ chức Đảng</span>
            </NavLink>

            <div className="sidebar-section">
              <div className="sidebar-section-title">Báo cáo & Thống kê</div>
            </div>

            <NavLink
              to="/statistics/members"
              aria-label="Thống kê Đảng viên"
              className={({ isActive }) =>
                `sidebar-link ${isActive ? "active" : ""}`
              }
            >
              <span className="sidebar-icon-box">
                <FiBarChart2 className="icon" />
              </span>
              <span className="sidebar-tooltip">Thống kê Đảng viên</span>
            </NavLink>

            {user?.role === ROLES.CAN_BO_CHINH_TRI && (
              <NavLink
                to="/statistics/committee"
                aria-label="Thống kê Cấp ủy"
                className={({ isActive }) =>
                  `sidebar-link ${isActive ? "active" : ""}`
                }
              >
                <span className="sidebar-icon-box">
                  <FiBriefcase className="icon" />
                </span>
                <span className="sidebar-tooltip">Thống kê Cấp ủy</span>
              </NavLink>
            )}

            <NavLink
              to="/statistics/activity"
              aria-label="Thống kê hoạt động"
              className={({ isActive }) =>
                `sidebar-link ${isActive ? "active" : ""}`
              }
            >
              <span className="sidebar-icon-box">
                <FiActivity className="icon" />
              </span>
              <span className="sidebar-tooltip">Thống kê hoạt động</span>
            </NavLink>

            <div className="sidebar-section">
              <div className="sidebar-section-title">Nghiệp vụ Đảng</div>
            </div>

            <NavLink
              to="/evaluations"
              aria-label="Xếp loại hàng năm"
              className={({ isActive }) =>
                `sidebar-link ${isActive ? "active" : ""}`
              }
            >
              <span className="sidebar-icon-box">
                <FiCheckSquare className="icon" />
              </span>
              <span className="sidebar-tooltip">Xếp loại hàng năm</span>
            </NavLink>

            <NavLink
              to="/badges"
              aria-label="Xét tặng Huy hiệu"
              className={({ isActive }) =>
                `sidebar-link ${isActive ? "active" : ""}`
              }
            >
              <span className="sidebar-icon-box">
                <FiAward className="icon" />
              </span>
              <span className="sidebar-tooltip">Xét tặng Huy hiệu</span>
            </NavLink>

            <NavLink
              to="/decisions"
              aria-label="Quản lý Quyết định"
              className={({ isActive }) =>
                `sidebar-link ${isActive ? "active" : ""}`
              }
            >
              <span className="sidebar-icon-box">
                <FiFileText className="icon" />
              </span>
              <span className="sidebar-tooltip">Quản lý Quyết định</span>
            </NavLink>

            {user?.role === ROLES.CAN_BO_CHINH_TRI && (
              <>
                <div className="sidebar-section">
                  <div className="sidebar-section-title">Hệ thống</div>
                </div>
                <NavLink
                  to="/users"
                  aria-label="Quản lý tài khoản"
                  className={({ isActive }) =>
                    `sidebar-link ${isActive ? "active" : ""}`
                  }
                >
                  <span className="sidebar-icon-box">
                    <FiShield className="icon" />
                  </span>
                  <span className="sidebar-tooltip">Quản lý tài khoản</span>
                </NavLink>
              </>
            )}
          </>
        )}
      </nav>
    </aside>
  );
}
