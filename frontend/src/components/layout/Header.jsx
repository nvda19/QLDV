import { useState, useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import {
  FiLogOut,
  FiBell,
  FiSend,
  FiCheckCircle,
  FiXCircle,
  FiKey,
  FiChevronDown,
  FiShield,
  FiX,
  FiSun,
  FiMoon,
} from "../icons";
import { useAuth } from "../../contexts/AuthContext";
import { useTheme } from "../../contexts/ThemeContext";
import { useNavigate } from "react-router-dom";
import { ROLE_LABELS } from "../../utils/constants";
import { getInitials } from "../../utils/helpers";
import notificationApi from "../../api/notificationApi";
import { useNotifications } from "../../contexts/NotificationContext";
import toast from "react-hot-toast";

function formatRelativeTime(dateStr) {
  if (!dateStr) return "";
  const now = new Date();
  const date = new Date(dateStr);
  const diffMs = now - date;
  const diffSec = Math.floor(diffMs / 1000);
  const diffMin = Math.floor(diffSec / 60);
  const diffHour = Math.floor(diffMin / 60);
  const diffDay = Math.floor(diffHour / 24);

  if (diffSec < 60) return "Vừa xong";
  if (diffMin < 60) return `${diffMin} phút trước`;
  if (diffHour < 24) return `${diffHour} giờ trước`;
  if (diffDay === 1) return "Hôm qua";
  if (diffDay < 30) return `${diffDay} ngày trước`;
  return `${Math.floor(diffDay / 30)} tháng trước`;
}

const NOTIF_ICON_MAP = {
  EVALUATION_SUBMITTED: { icon: FiSend, color: "var(--color-accent)" },
  EVALUATION_APPROVED: { icon: FiCheckCircle, color: "var(--color-success)" },
  EVALUATION_REJECTED: { icon: FiXCircle, color: "var(--color-error)" },
  SYSTEM: { icon: FiBell, color: "var(--color-info)" },
};

function getNotifIcon(type) {
  return NOTIF_ICON_MAP[type] || NOTIF_ICON_MAP.SYSTEM;
}

export default function Header() {
  const { user, logout, changePassword } = useAuth();
  const { isDark, toggleTheme } = useTheme();
  const navigate = useNavigate();

  const { unreadCount, setUnreadCount, refreshCount } = useNotifications();
  const [showDropdown, setShowDropdown] = useState(false);
  const [dropdownNotifs, setDropdownNotifs] = useState([]);
  const [loadingDropdown, setLoadingDropdown] = useState(false);
  const dropdownRef = useRef(null);
  const bellRef = useRef(null);

  // Trạng thái menu cá nhân & đổi mật khẩu
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [passwordError, setPasswordError] = useState("");
  const [passwordLoading, setPasswordLoading] = useState(false);
  const userMenuRef = useRef(null);
  const userBtnRef = useRef(null);

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  // Bấm ra ngoài khung dropdown thông báo hoặc menu người dùng thì tự động đóng lại
  useEffect(() => {
    function handleClickOutside(e) {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(e.target) &&
        bellRef.current &&
        !bellRef.current.contains(e.target)
      ) {
        setShowDropdown(false);
      }
      if (
        userMenuRef.current &&
        !userMenuRef.current.contains(e.target) &&
        userBtnRef.current &&
        !userBtnRef.current.contains(e.target)
      ) {
        setShowUserMenu(false);
      }
    }
    if (showDropdown || showUserMenu) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [showDropdown, showUserMenu]);

  const handleToggleUserMenu = () => {
    setShowDropdown(false);
    setShowUserMenu((prev) => !prev);
  };

  const handleToggleDropdown = async () => {
    setShowUserMenu(false);
    const next = !showDropdown;
    setShowDropdown(next);
    if (next) {
      setLoadingDropdown(true);
      try {
        const res = await notificationApi.getAll({ page: 1, limit: 8 });
        setDropdownNotifs(res.data?.notifications || []);
      } catch {
        setDropdownNotifs([]);
      } finally {
        setLoadingDropdown(false);
      }
    }
  };

  const handleNotifClick = async (notif) => {
    try {
      if (!notif.isRead) {
        await notificationApi.markAsRead(notif.id);
        setDropdownNotifs((prev) =>
          prev.map((n) => (n.id === notif.id ? { ...n, isRead: true } : n)),
        );
        // Trừ tạm số đếm ở giao diện trước cho mượt, sau đó gọi API để đồng bộ lại số chính xác
        setUnreadCount((c) => Math.max(0, c - 1));
        refreshCount();
      }
      setShowDropdown(false);
      if (notif.link) navigate(notif.link);
    } catch {
      // Không đọc được thông báo cũng không sao, bỏ qua để không làm phiền người dùng
    }
  };

  const handleMarkAllRead = async () => {
    try {
      await notificationApi.markAllAsRead();
      setDropdownNotifs((prev) => prev.map((n) => ({ ...n, isRead: true })));
      setUnreadCount(0);
      refreshCount();
    } catch {
      // Đánh dấu tất cả thất bại thì bỏ qua, người dùng có thể thử lại sau
    }
  };

  const handleChangePasswordSubmit = async (e) => {
    e.preventDefault();
    if (!newPassword || newPassword.length < 6) {
      setPasswordError("Mật khẩu mới phải có ít nhất 6 ký tự.");
      return;
    }
    if (newPassword !== confirmPassword) {
      setPasswordError("Mật khẩu xác nhận không khớp.");
      return;
    }

    setPasswordLoading(true);
    setPasswordError("");
    try {
      await changePassword(newPassword);
      toast.success("Đổi mật khẩu thành công!");
      setShowPasswordModal(false);
      setNewPassword("");
      setConfirmPassword("");
    } catch (err) {
      setPasswordError(
        err.response?.data?.message || err.message || "Đổi mật khẩu thất bại.",
      );
    } finally {
      setPasswordLoading(false);
    }
  };

  return (
    <header className="header">
      <div
        className="header-left"
        style={{
          display: "flex",
          alignItems: "center",
          gap: "12px",
          cursor: "default",
        }}
      >
        {/* Logo chính thức của hệ thống */}
        <img
          src="/logo.png"
          alt="Logo"
          style={{
            width: "38px",
            height: "38px",
            objectFit: "contain",
            flexShrink: 0,
            filter: "drop-shadow(0 1px 3px rgba(0,0,0,0.25))",
          }}
        />

        {/* Tên hệ thống hiển thị cạnh logo */}
        <div
          style={{
            fontSize: "14px",
            fontWeight: "800",
            color: "var(--color-primary-dark)",
            textTransform: "uppercase",
            letterSpacing: "0.4px",
            lineHeight: 1.2,
            maxWidth: "260px",
          }}
        >
          Phần mềm Quản lý Đảng viên Nội bộ
        </div>
      </div>

      <div className="header-right">
        {/* Chuông thông báo và dropdown xổ xuống */}
        <div style={{ position: "relative" }}>
          <button
            ref={bellRef}
            onClick={handleToggleDropdown}
            style={{
              position: "relative",
              background: showDropdown
                ? "var(--color-bg-hover)"
                : "transparent",
              border: "1px solid var(--color-border)",
              borderRadius: "8px",
              padding: "8px",
              cursor: "pointer",
              color: "var(--color-text-primary)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              transition: "all 0.2s ease",
              width: "38px",
              height: "38px",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = "var(--color-bg-hover)";
              e.currentTarget.style.borderColor = "var(--color-border-focus)";
            }}
            onMouseLeave={(e) => {
              if (!showDropdown) {
                e.currentTarget.style.background = "transparent";
                e.currentTarget.style.borderColor = "var(--color-border)";
              }
            }}
            title="Thông báo"
          >
            <FiBell size={18} />
            {unreadCount > 0 && (
              <span
                style={{
                  position: "absolute",
                  top: "-4px",
                  right: "-4px",
                  background: "#c44545",
                  color: "#fff",
                  fontSize: "10px",
                  fontWeight: "700",
                  minWidth: "18px",
                  height: "18px",
                  borderRadius: "9px",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  padding: "0 4px",
                  border: "2px solid var(--color-bg-secondary)",
                  lineHeight: 1,
                }}
              >
                {unreadCount > 99 ? "99+" : unreadCount}
              </span>
            )}
          </button>

          {/* Khung dropdown, chỉ hiện khi showDropdown bật */}
          {showDropdown && (
            <div
              ref={dropdownRef}
              style={{
                position: "absolute",
                top: "calc(100% + 8px)",
                right: 0,
                width: "380px",
                maxHeight: "400px",
                background: "var(--color-bg-secondary)",
                border: "1px solid var(--color-border)",
                borderRadius: "12px",
                boxShadow: "var(--shadow-lg)",
                zIndex: 1000,
                display: "flex",
                flexDirection: "column",
                animation: "fadeIn 0.15s ease-out",
                overflow: "hidden",
              }}
            >
              {/* Phần đầu dropdown: tiêu đề, số lượng chưa đọc, nút đánh dấu tất cả */}
              <div
                style={{
                  padding: "14px 16px",
                  borderBottom: "1px solid var(--color-border)",
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  flexShrink: 0,
                }}
              >
                <span
                  style={{
                    fontWeight: "600",
                    fontSize: "var(--font-size-sm)",
                    color: "var(--color-text-primary)",
                  }}
                >
                  Thông báo
                  {unreadCount > 0 && (
                    <span
                      style={{
                        marginLeft: "8px",
                        background: "rgba(196, 69, 69, 0.2)",
                        color: "#c44545",
                        fontSize: "11px",
                        padding: "2px 8px",
                        borderRadius: "10px",
                        fontWeight: "600",
                      }}
                    >
                      {unreadCount} mới
                    </span>
                  )}
                </span>
                {unreadCount > 0 && (
                  <button
                    onClick={handleMarkAllRead}
                    style={{
                      background: "none",
                      border: "none",
                      color: "var(--color-accent)",
                      fontSize: "12px",
                      cursor: "pointer",
                      padding: "2px 6px",
                      borderRadius: "4px",
                      transition: "background 0.15s",
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.background =
                        "rgba(30, 64, 175, 0.1)";
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.background = "none";
                    }}
                  >
                    Đánh dấu tất cả đã đọc
                  </button>
                )}
              </div>

              {/* Danh sách thông báo gần đây, có xử lý trạng thái đang tải và không có dữ liệu */}
              <div
                style={{
                  flex: 1,
                  overflowY: "auto",
                  overflowX: "hidden",
                }}
              >
                {loadingDropdown ? (
                  <div
                    style={{
                      padding: "var(--spacing-xl)",
                      textAlign: "center",
                      color: "var(--color-text-muted)",
                      fontSize: "var(--font-size-sm)",
                    }}
                  >
                    Đang tải...
                  </div>
                ) : dropdownNotifs.length === 0 ? (
                  <div
                    style={{
                      padding: "var(--spacing-xl) var(--spacing-lg)",
                      textAlign: "center",
                    }}
                  >
                    <FiBell
                      style={{
                        fontSize: "32px",
                        color: "var(--color-text-muted)",
                        opacity: 0.4,
                        marginBottom: "8px",
                      }}
                    />
                    <p
                      style={{
                        color: "var(--color-text-muted)",
                        fontSize: "var(--font-size-sm)",
                        margin: 0,
                      }}
                    >
                      Không có thông báo nào
                    </p>
                  </div>
                ) : (
                  dropdownNotifs.map((notif) => {
                    const { icon: NotifIcon, color: iconColor } = getNotifIcon(
                      notif.type,
                    );
                    const isUnread = !notif.isRead;
                    return (
                      <div
                        key={notif.id}
                        onClick={() => handleNotifClick(notif)}
                        style={{
                          display: "flex",
                          alignItems: "flex-start",
                          gap: "12px",
                          padding: "12px 16px",
                          cursor: notif.link ? "pointer" : "default",
                          background: isUnread
                            ? "rgba(30, 64, 175, 0.04)"
                            : "transparent",
                          borderBottom: "1px solid var(--color-border-light)",
                          transition: "background 0.15s",
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.background =
                            "var(--color-bg-hover)";
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.background = isUnread
                            ? "rgba(30, 64, 175, 0.04)"
                            : "transparent";
                        }}
                      >
                        <div
                          style={{
                            width: "34px",
                            height: "34px",
                            borderRadius: "8px",
                            background: `${iconColor}15`,
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            flexShrink: 0,
                          }}
                        >
                          <NotifIcon
                            style={{ fontSize: "15px", color: iconColor }}
                          />
                        </div>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div
                            style={{
                              fontWeight: isUnread ? "600" : "400",
                              fontSize: "13px",
                              color: isUnread
                                ? "var(--color-text-primary)"
                                : "var(--color-text-muted)",
                              marginBottom: "2px",
                              overflow: "hidden",
                              textOverflow: "ellipsis",
                              whiteSpace: "nowrap",
                            }}
                          >
                            {notif.title}
                          </div>
                          <div
                            style={{
                              fontSize: "11px",
                              color: "var(--color-text-muted)",
                              opacity: 0.7,
                            }}
                          >
                            {formatRelativeTime(notif.createdAt)}
                          </div>
                        </div>
                        {isUnread && (
                          <span
                            style={{
                              width: "8px",
                              height: "8px",
                              borderRadius: "50%",
                              background: "var(--color-accent)",
                              flexShrink: 0,
                              marginTop: "6px",
                            }}
                          />
                        )}
                      </div>
                    );
                  })
                )}
              </div>

              {/* Nút chuyển sang trang danh sách thông báo đầy đủ */}
              <div
                style={{
                  padding: "10px 16px",
                  borderTop: "1px solid var(--color-border)",
                  textAlign: "center",
                  flexShrink: 0,
                }}
              >
                <button
                  onClick={() => {
                    setShowDropdown(false);
                    navigate("/notifications");
                  }}
                  style={{
                    background: "none",
                    border: "none",
                    color: "var(--color-accent)",
                    fontSize: "13px",
                    cursor: "pointer",
                    fontWeight: "500",
                    padding: "4px 12px",
                    borderRadius: "6px",
                    transition: "background 0.15s",
                    width: "100%",
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = "rgba(30, 64, 175, 0.1)";
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = "none";
                  }}
                >
                  Xem tất cả thông báo →
                </button>
              </div>
            </div>
          )}
        </div>


        {/* User Profile Dropdown Menu */}
        <div style={{ position: "relative" }}>
          <button
            ref={userBtnRef}
            type="button"
            className={`header-user-btn ${showUserMenu ? "active" : ""}`}
            onClick={handleToggleUserMenu}
            aria-expanded={showUserMenu}
            aria-haspopup="true"
            title="Tài khoản cá nhân"
          >
            <div className="header-user-info">
              <div className="header-user-name">
                {user?.HoTen || user?.username || "Người dùng"}
              </div>
              <div className="header-user-role">
                {user ? ROLE_LABELS[user.role] || user.role : ""}
              </div>
            </div>
            <div className="header-avatar">
              {user ? getInitials(user.HoTen || user.username) : "?"}
            </div>
            <FiChevronDown
              className={`header-user-chevron ${showUserMenu ? "rotate" : ""}`}
            />
          </button>

          {/* User profile dropdown popup */}
          {showUserMenu && (
            <div ref={userMenuRef} className="header-user-menu">
              <div className="header-user-menu-header">
                <div className="header-user-menu-avatar">
                  {user ? getInitials(user.HoTen || user.username) : "?"}
                </div>
                <div className="header-user-menu-details">
                  <div className="header-user-menu-name">
                    {user?.HoTen || user?.username || "Người dùng"}
                  </div>
                  <div className="header-user-menu-username">
                    @{user?.username}
                  </div>
                  <div className="header-user-menu-badge">
                    <FiShield size={11} style={{ marginRight: 4 }} />
                    {user ? ROLE_LABELS[user.role] || user.role : ""}
                  </div>
                  {user?.organization?.TenToChuc && (
                    <div
                      className="header-user-menu-org"
                      title={user.organization.TenToChuc}
                    >
                      {user.organization.TenToChuc}
                    </div>
                  )}
                </div>
              </div>

              <div className="header-user-menu-divider" />

              <div className="header-user-menu-actions">
                {/* Chuyển đổi giao diện sáng / tối trong menu */}
                <div
                  className="header-user-menu-item header-user-theme-row"
                  onClick={toggleTheme}
                  role="button"
                  tabIndex={0}
                >
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "10px",
                    }}
                  >
                    {isDark ? (
                      <FiMoon
                        className="header-user-menu-icon"
                        style={{ color: "var(--color-gold)" }}
                      />
                    ) : (
                      <FiSun
                        className="header-user-menu-icon"
                        style={{ color: "var(--color-gold-dark)" }}
                      />
                    )}
                    <span>Giao diện {isDark ? "Tối" : "Sáng"}</span>
                  </div>
                  <div className={`theme-switch-pill ${isDark ? "dark" : ""}`}>
                    <div className="theme-switch-knob">
                      {isDark ? (
                        <FiMoon size={9} style={{ color: "#fbbf24" }} />
                      ) : (
                        <FiSun size={9} style={{ color: "#d97706" }} />
                      )}
                    </div>
                  </div>
                </div>

                <button
                  type="button"
                  className="header-user-menu-item"
                  onClick={() => {
                    setShowUserMenu(false);
                    setShowPasswordModal(true);
                    setPasswordError("");
                    setNewPassword("");
                    setConfirmPassword("");
                  }}
                >
                  <FiKey className="header-user-menu-icon" />
                  <span>Đổi mật khẩu</span>
                </button>

                <div className="header-user-menu-divider" />

                <button
                  type="button"
                  className="header-user-menu-item danger"
                  onClick={() => {
                    setShowUserMenu(false);
                    handleLogout();
                  }}
                >
                  <FiLogOut className="header-user-menu-icon" />
                  <span>Đăng xuất</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Modal đổi mật khẩu trực tiếp từ Header được portal ra document.body để luôn căn giữa màn hình */}
      {showPasswordModal &&
        createPortal(
          <div
            className="modal-overlay"
            onClick={() => setShowPasswordModal(false)}
            style={{
              position: "fixed",
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              width: "100vw",
              height: "100vh",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              zIndex: 9999,
              background: "rgba(0, 0, 0, 0.65)",
              backdropFilter: "blur(4px)",
              WebkitBackdropFilter: "blur(4px)",
              padding: "16px",
              boxSizing: "border-box",
              margin: 0,
            }}
          >
            <div
              className="modal"
              onClick={(e) => e.stopPropagation()}
              style={{
                maxWidth: "420px",
                width: "100%",
                margin: "auto",
                position: "relative",
                transform: "none",
              }}
            >
              <div
                className="modal-header"
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  marginBottom: "var(--spacing-md)",
                }}
              >
                <h3
                  className="modal-title"
                  style={{
                    margin: 0,
                    display: "flex",
                    alignItems: "center",
                    gap: "8px",
                    fontSize: "16px",
                  }}
                >
                  <FiKey style={{ color: "var(--color-gold-dark)" }} />
                  Đổi mật khẩu
                </h3>
                <button
                  type="button"
                  className="btn-icon"
                  onClick={() => setShowPasswordModal(false)}
                  style={{
                    background: "transparent",
                    border: "none",
                    cursor: "pointer",
                    color: "var(--color-text-muted)",
                  }}
                >
                  <FiX size={18} />
                </button>
              </div>

              <form onSubmit={handleChangePasswordSubmit}>
                <div
                  className="form-group"
                  style={{ marginBottom: "var(--spacing-md)" }}
                >
                  <label className="form-label" style={{ fontSize: "13px" }}>
                    Mật khẩu mới{" "}
                    <span style={{ color: "var(--color-error)" }}>*</span>
                  </label>
                  <input
                    type="password"
                    className="form-input"
                    placeholder="Nhập ít nhất 6 ký tự"
                    value={newPassword}
                    onChange={(e) => {
                      setNewPassword(e.target.value);
                      if (passwordError) setPasswordError("");
                    }}
                    autoFocus
                    required
                  />
                </div>

                <div
                  className="form-group"
                  style={{ marginBottom: "var(--spacing-md)" }}
                >
                  <label className="form-label" style={{ fontSize: "13px" }}>
                    Xác nhận mật khẩu mới{" "}
                    <span style={{ color: "var(--color-error)" }}>*</span>
                  </label>
                  <input
                    type="password"
                    className="form-input"
                    placeholder="Nhập lại mật khẩu mới"
                    value={confirmPassword}
                    onChange={(e) => {
                      setConfirmPassword(e.target.value);
                      if (passwordError) setPasswordError("");
                    }}
                    required
                  />
                </div>

                {passwordError && (
                  <div
                    style={{
                      color: "var(--color-error)",
                      fontSize: "12px",
                      marginBottom: "var(--spacing-md)",
                      padding: "6px 10px",
                      background: "rgba(220, 38, 38, 0.08)",
                      borderRadius: "6px",
                    }}
                  >
                    {passwordError}
                  </div>
                )}

                <div
                  style={{
                    display: "flex",
                    justifyContent: "flex-end",
                    gap: "10px",
                    marginTop: "var(--spacing-lg)",
                  }}
                >
                  <button
                    type="button"
                    className="btn btn-outline"
                    onClick={() => setShowPasswordModal(false)}
                    disabled={passwordLoading}
                  >
                    Hủy
                  </button>
                  <button
                    type="submit"
                    className="btn btn-primary"
                    disabled={passwordLoading}
                  >
                    {passwordLoading ? "Đang xử lý..." : "Cập nhật mật khẩu"}
                  </button>
                </div>
              </form>
            </div>
          </div>,
          document.body,
        )}
    </header>
  );
}
