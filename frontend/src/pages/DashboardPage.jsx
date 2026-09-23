import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  FiUsers,
  FiLayers,
  FiShield,
  FiBarChart2,
  FiAward,
  FiCheckSquare,
  FiArrowRight,
  FiUserCheck,
  FiBriefcase,
} from "../components/icons";
import { useAuth } from "../contexts/AuthContext";
import memberApi from "../api/memberApi";
import orgApi from "../api/orgApi";
import LoadingSpinner from "../components/common/LoadingSpinner";
import { ROLES } from "../utils/constants";

export default function DashboardPage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [stats, setStats] = useState({
    membersCount: 0,
    orgsCount: 0,
    officialCount: 0,
    probationaryCount: 0,
    maleCount: 0,
    femaleCount: 0,
    capTaCount: 0,
    capUyCount: 0,
    qncnCount: 0,
    badgeCount: 0,
    orgName: "",
  });
  const [memberData, setMemberData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        if (user?.role === ROLES.DANG_VIEN) {
          const res = await memberApi.getAll();
          setMemberData(res.data?.[0] || null);
          setLoading(false);
          return;
        }

        const [membersRes, orgsRes] = await Promise.all([
          memberApi.getAll(),
          orgApi.getAll(),
        ]);

        const members = membersRes.data || [];
        const orgs = orgsRes.data || [];

        // Duyệt đệ quy để lấy toàn bộ ID của các tổ chức Đảng trực thuộc (cấp dưới)
        const getSubOrgIds = (orgId) => {
          const ids = [orgId];
          const findChildren = (id) => {
            orgs.forEach((o) => {
              if (o.parentId === id) {
                ids.push(o.id);
                findChildren(o.id);
              }
            });
          };
          findChildren(orgId);
          return ids;
        };

        let targetOrgIds = [];
        let orgName = "Toàn Đảng bộ Học viện";

        if (user?.role === ROLES.BI_THU && user?.orgId) {
          targetOrgIds = getSubOrgIds(user.orgId);
          const userOrg = orgs.find((o) => o.id === user.orgId);
          if (userOrg) {
            orgName = userOrg.name;
          }
        } else {
          targetOrgIds = orgs.map((o) => o.id);
        }

        // Chỉ tính đảng viên đang hoạt động và thuộc phạm vi tổ chức được phép xem
        // (Cán bộ chính trị xem toàn Đảng bộ, Bí thư chỉ xem chi bộ/đảng bộ mình phụ trách)
        const activeMembers = members.filter(
          (m) =>
            m.TrangThai === "HOAT_DONG" &&
            (user?.role === ROLES.CAN_BO_CHINH_TRI ||
              targetOrgIds.includes(m.ToChucDangId)),
        );

        const officialCount = activeMembers.filter(
          (m) => m.NgayChinhThuc,
        ).length;
        const probationaryCount = activeMembers.filter(
          (m) => !m.NgayChinhThuc,
        ).length;
        const maleCount = activeMembers.filter(
          (m) => m.GioiTinh === "Nam",
        ).length;
        const femaleCount = activeMembers.filter(
          (m) => m.GioiTinh === "Nữ",
        ).length;

        // Phân loại theo quân hàm: Cấp Tá, Cấp Úy và Quân nhân chuyên nghiệp (QNCN)
        const capTaCount = activeMembers.filter(
          (m) => m.CapBac && m.CapBac.toLowerCase().includes("tá"),
        ).length;
        const capUyCount = activeMembers.filter(
          (m) =>
            m.CapBac &&
            (m.CapBac.toLowerCase().includes("úy") ||
              m.CapBac.toLowerCase().includes("uý")),
        ).length;
        const qncnCount = activeMembers.filter(
          (m) => m.CapBac && m.CapBac.toUpperCase().includes("QNCN"),
        ).length;

        // Tuổi Đảng đủ 30 năm trở lên thì đủ điều kiện xét tặng Huy hiệu Đảng
        const currentYear = new Date().getFullYear();
        const badgeCount = activeMembers.filter((m) => {
          if (!m.NgayVaoDang) return false;
          const joinYear = new Date(m.NgayVaoDang).getFullYear();
          return currentYear - joinYear >= 30;
        }).length;

        setStats({
          membersCount: activeMembers.length,
          orgsCount:
            user?.role === ROLES.BI_THU ? targetOrgIds.length : orgs.length,
          officialCount,
          probationaryCount,
          maleCount,
          femaleCount,
          capTaCount,
          capUyCount,
          qncnCount,
          badgeCount,
          orgName,
        });
      } catch (err) {
        console.error("Failed to load dashboard stats", err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [user]);

  if (loading) {
    return <LoadingSpinner />;
  }

  if (user?.role === ROLES.DANG_VIEN) {
    const memberId = user?.memberId || user?.dangVienId;
    return (
      <div className="page animate-fade-in">
        {/* Banner chào mừng đảng viên */}
        <div className="dashboard-hero">
          <div className="hero-overlay"></div>
          <h1 className="hero-title">XIN CHÀO ĐỒNG CHÍ {user?.hoTen?.toUpperCase() || ''}</h1>
          <h2 className="hero-subtitle">CỔNG THÔNG TIN HỒ SƠ ĐẢNG VIÊN CÁ NHÂN</h2>
          <div className="hero-divider"></div>
          <p className="hero-description">
            Tra cứu thông tin hồ sơ lý lịch đảng viên, lịch sử cấp bậc quân hàm, các quyết định khen thưởng, kỷ luật và thông báo từ chi bộ.
          </p>
        </div>

        {/* Thẻ điều hướng cá nhân */}
        <div className="features-grid" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))' }}>
          <div className="feature-card">
            <div>
              <div className="feature-card-header">
                <div className="feature-card-icon">
                  <FiUsers />
                </div>
                <h3 className="feature-card-title">Hồ sơ lý lịch đảng viên</h3>
              </div>
              <p className="feature-card-body">
                Xem toàn bộ thông tin lý lịch cá nhân, thông tin gia đình, quá trình đào tạo, quá trình công tác và lịch sử thăng quân hàm của bản thân.
              </p>
            </div>
            <div className="feature-card-footer">
              <button
                className="feature-card-btn"
                onClick={() => navigate(memberId ? `/members/${memberId}` : '/members')}
              >
                Xem chi tiết hồ sơ <FiArrowRight />
              </button>
            </div>
          </div>

          <div className="feature-card">
            <div>
              <div className="feature-card-header">
                <div className="feature-card-icon">
                  <FiAward />
                </div>
                <h3 className="feature-card-title">Văn bản & Quyết định</h3>
              </div>
              <p className="feature-card-body">
                Tra cứu, xem trước và tải về các văn bản quyết định khen thưởng, kỷ luật, xếp loại Đảng viên hoặc trao tặng Huy hiệu Đảng liên quan đến bản thân.
              </p>
            </div>
            <div className="feature-card-footer">
              <button
                className="feature-card-btn"
                onClick={() => navigate('/decisions')}
              >
                Xem quyết định <FiArrowRight />
              </button>
            </div>
          </div>

          <div className="feature-card">
            <div>
              <div className="feature-card-header">
                <div className="feature-card-icon">
                  <FiCheckSquare />
                </div>
                <h3 className="feature-card-title">Thông báo hệ thống</h3>
              </div>
              <p className="feature-card-body">
                Tiếp nhận các thông báo từ chi bộ, nhắc nhở công việc và cập nhật trạng thái hồ sơ của đồng chí.
              </p>
            </div>
            <div className="feature-card-footer">
              <button
                className="feature-card-btn"
                onClick={() => navigate('/notifications')}
              >
                Xem thông báo <FiArrowRight />
              </button>
            </div>
          </div>
        </div>

        {/* Bảng tóm tắt thông tin nhanh của Đảng viên */}
        {memberData && (
          <div className="card" style={{ marginTop: 'var(--spacing-xl)' }}>
            <div className="card-header">
              <h3 className="card-title">Thông tin Đảng viên tóm tắt</h3>
              <span className="text-muted" style={{ fontSize: 'var(--font-size-sm)' }}>
                Chi bộ: <strong>{memberData.ToChucDang?.Ten || 'Chưa phân công'}</strong>
              </span>
            </div>
            <div className="form-grid" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 'var(--spacing-lg)' }}>
              <div>
                <span className="text-muted" style={{ fontSize: 'var(--font-size-xs)' }}>Số thẻ Đảng viên</span>
                <p style={{ fontWeight: '600', margin: '4px 0 0 0' }}>{memberData.SoTheDangVien || 'Chưa cấp'}</p>
              </div>
              <div>
                <span className="text-muted" style={{ fontSize: 'var(--font-size-xs)' }}>Số lý lịch</span>
                <p style={{ fontWeight: '600', margin: '4px 0 0 0' }}>{memberData.SoLyLich || '—'}</p>
              </div>
              <div>
                <span className="text-muted" style={{ fontSize: 'var(--font-size-xs)' }}>Ngày vào Đảng</span>
                <p style={{ fontWeight: '600', margin: '4px 0 0 0' }}>
                  {memberData.NgayVaoDang ? new Date(memberData.NgayVaoDang).toLocaleDateString('vi-VN') : '—'}
                </p>
              </div>
              <div>
                <span className="text-muted" style={{ fontSize: 'var(--font-size-xs)' }}>Ngày chính thức</span>
                <p style={{ fontWeight: '600', margin: '4px 0 0 0' }}>
                  {memberData.NgayChinhThuc ? new Date(memberData.NgayChinhThuc).toLocaleDateString('vi-VN') : 'Đảng viên dự bị'}
                </p>
              </div>
              <div>
                <span className="text-muted" style={{ fontSize: 'var(--font-size-xs)' }}>Cấp bậc / Chức vụ</span>
                <p style={{ fontWeight: '600', margin: '4px 0 0 0' }}>
                  {(memberData.CapBac || '—') + ' / ' + (memberData.ChucVu || '—')}
                </p>
              </div>
              <div>
                <span className="text-muted" style={{ fontSize: 'var(--font-size-xs)' }}>Khen thưởng</span>
                <p style={{ fontWeight: '600', margin: '4px 0 0 0', color: 'var(--color-accent)' }}>
                  {memberData.KhenThuong || 'Chưa ghi nhận'}
                </p>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }

  const features = [
    {
      icon: FiUsers,
      title: "Quản lý Hồ sơ Đảng viên",
      description:
        "Cơ sở dữ liệu lý lịch toàn diện về quá trình công tác, lịch sử thăng quân hàm, trình độ chuyên môn, đào tạo bồi dưỡng nâng cao và chính sách gia đình.",
      link: "/members",
      btnText: "Quản lý Hồ sơ",
    },
    {
      icon: FiBarChart2,
      title: "Thống kê & Báo cáo cơ cấu",
      description:
        "Hỗ trợ phân tích cơ cấu đảng số và tự động kết xuất các biểu mẫu thống kê chuẩn Mẫu 6-TKCT của Ban Tổ chức Trung ương.",
      link: "/statistics/members",
      btnText: "Xem Báo cáo",
    },
    {
      icon: FiCheckSquare,
      title: "Bình xét & Xếp loại hàng năm",
      description:
        "Công cụ thực hiện quy trình bình xét, phân tích chất lượng, xếp loại Đảng viên và tổ chức Đảng trực thuộc định kỳ cuối năm.",
      link: "/evaluations",
      btnText: "Bình xét Xếp loại",
    },
    {
      icon: FiAward,
      title: "Xét tặng Huy hiệu Đảng",
      description:
        "Tự động rà soát niên hạn tuổi Đảng của toàn bộ Đảng viên, lập danh sách đề xuất trao tặng Huy hiệu Đảng 30 năm đến 80 năm.",
      link: "/badges",
      btnText: "Xét duyệt Huy hiệu",
    },
    {
      icon: FiLayers,
      title: "Cơ cấu Tổ chức Đảng",
      description:
        "Sơ đồ phân cấp hình cây từ Đảng bộ cấp trên xuống các tổ chức Đảng trực thuộc và các Chi bộ cơ sở.",
      link: "/organizations",
      btnText: "Quản lý Tổ chức",
    },
    ...(user?.role === ROLES.CAN_BO_CHINH_TRI
      ? [
          {
            icon: FiShield,
            title: "Tài khoản & Kiểm toán Hệ thống",
            description:
              "Giám sát phân quyền truy cập người dùng và tự động lưu nhật ký hoạt động (Audit log) nhằm đảm bảo an toàn cơ sở dữ liệu chuyên ngành.",
            link: "/users",
            btnText: "Cấu hình Hệ thống",
          },
        ]
      : []),
  ];

  const percentOfficial =
    stats.membersCount > 0
      ? Math.round((stats.officialCount / stats.membersCount) * 100)
      : 0;

  return (
    <div className="page animate-fade-in">
      {/* Banner giới thiệu hệ thống */}
      <div className="dashboard-hero">
        <div className="hero-overlay"></div>
        <h1 className="hero-title">HỆ THỐNG QUẢN LÝ ĐẢNG VIÊN</h1>
        <h2 className="hero-subtitle">PHÂN HỆ NGHIỆP VỤ & PHÂN TÍCH ĐẢNG SỐ</h2>
        <div className="hero-divider"></div>
        <p className="hero-description">
          Hệ thống lưu trữ hồ sơ lý lịch chuyên sâu, quản lý quá trình công tác,
          đào tạo, thăng quân hàm và bình xét xếp loại dành cho các cấp Cấp ủy,
          Đảng bộ và Chi bộ.
        </p>
      </div>

      {/* Lưới điều hướng tới các phân hệ nghiệp vụ */}
      <div className="features-grid">
        {features.map((feat, idx) => {
          const Icon = feat.icon;
          return (
            <div key={idx} className="feature-card">
              <div>
                <div className="feature-card-header">
                  <div className="feature-card-icon">
                    <Icon />
                  </div>
                  <h3 className="feature-card-title">{feat.title}</h3>
                </div>
                <p className="feature-card-body">{feat.description}</p>
              </div>
              <div className="feature-card-footer">
                <button
                  className="feature-card-btn"
                  onClick={() => navigate(feat.link)}
                >
                  {feat.btnText} <FiArrowRight />
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Tiêu đề khu vực số liệu thống kê */}
      <div className="dashboard-section-header">
        <div>
          <h2 className="dashboard-section-title">
            Số liệu thống kê chuyên ngành
          </h2>
          <span className="dashboard-section-subtitle">
            Phạm vi quản lý: <strong>{stats.orgName}</strong>
          </span>
        </div>
        <div className="dashboard-section-subtitle">
          Cập nhật: {new Date().toLocaleDateString("vi-VN")}
        </div>
      </div>

      {/* Các ô thống kê nhanh */}
      <div className="dashboard-stats-grid">
        {/* Ô 1: Tổng số đảng viên đang quản lý */}
        <div className="stat-widget-card">
          <FiUsers className="bg-watermark-icon" />
          <div className="stat-widget-header">
            <span className="stat-widget-label">Đảng viên quản lý</span>
            <FiUsers className="stat-widget-icon" />
          </div>
          <h3 className="stat-widget-value">{stats.membersCount} đồng chí</h3>
          <span className="stat-widget-subtext">
            Nhân sự sinh hoạt chính thức & dự bị
          </span>
        </div>

        {/* Ô 2: Tỉ lệ chính thức so với dự bị */}
        <div className="stat-widget-card widget-gold">
          <FiUserCheck className="bg-watermark-icon" />
          <div className="stat-widget-header">
            <span className="stat-widget-label">Cơ cấu đảng số</span>
            <FiUserCheck className="stat-widget-icon" />
          </div>
          <div className="stat-list">
            <div className="stat-list-item">
              <span>Chính thức:</span>
              <span>{stats.officialCount} đồng chí</span>
            </div>
            <div className="stat-list-item">
              <span>Dự bị:</span>
              <span>{stats.probationaryCount} đồng chí</span>
            </div>
          </div>
          <div className="stat-widget-progress">
            <div className="progress-label-row">
              <span>Tỉ lệ chính thức</span>
              <span>{percentOfficial}%</span>
            </div>
            <div className="progress-bar-container">
              <div
                className="progress-bar-fill"
                style={{ width: `${percentOfficial}%` }}
              ></div>
            </div>
          </div>
        </div>

        {/* Ô 3: Đảng viên đủ điều kiện Huy hiệu Đảng */}
        <div className="stat-widget-card widget-info">
          <FiAward className="bg-watermark-icon" />
          <div className="stat-widget-header">
            <span className="stat-widget-label">Huy hiệu Đảng</span>
            <FiAward className="stat-widget-icon" />
          </div>
          <h3 className="stat-widget-value">{stats.badgeCount} đồng chí</h3>
          <span className="stat-widget-subtext">
            Đủ điều kiện (tuổi Đảng ≥ 30 năm)
          </span>
        </div>

        {/* Ô 4: Cơ cấu quân hàm và giới tính */}
        <div className="stat-widget-card widget-gold">
          <FiBriefcase className="bg-watermark-icon" />
          <div className="stat-widget-header">
            <span className="stat-widget-label">Quân hàm & Giới tính</span>
            <FiBriefcase className="stat-widget-icon" />
          </div>
          <div className="stat-list">
            <div className="stat-list-item">
              <span>Cấp Tá / Cấp Úy:</span>
              <span>
                {stats.capTaCount} / {stats.capUyCount} đ/c
              </span>
            </div>
            <div className="stat-list-item">
              <span>QNCN:</span>
              <span>{stats.qncnCount} đồng chí</span>
            </div>
            <div className="stat-list-item">
              <span>Nam / Nữ:</span>
              <span>
                {stats.maleCount} / {stats.femaleCount} đồng chí
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
