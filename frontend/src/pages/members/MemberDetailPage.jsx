import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import { useAuth } from "../../contexts/AuthContext";
import { ROLES } from "../../utils/constants";
import memberApi from "../../api/memberApi";
import LoadingSpinner from "../../components/common/LoadingSpinner";
import ConfirmModal from "../../components/common/ConfirmModal";

// Các component con dựng nên hồ sơ chi tiết đảng viên
import DetailToolbar from "../../components/members/DetailToolbar";
import DetailPersonalInfo from "../../components/members/DetailPersonalInfo";
import DetailPartyInfo from "../../components/members/DetailPartyInfo";
import DetailHistoryTables from "../../components/members/DetailHistoryTables";
import DetailFamilyTable from "../../components/members/DetailFamilyTable";
import DetailEconomicInfo from "../../components/members/DetailEconomicInfo";
import DecisionPreviewModal from "../../components/common/DecisionPreviewModal";

const renderSplitBoxes = (val, group1Len, group2Len) => {
  const cleanVal = String(val || "").replace(/[^0-9A-Za-z-]/g, ""); // Chỉ giữ lại chữ và số
  const chars = cleanVal.split("");

  const makeGroup = (start, len) => {
    const cells = [];
    for (let i = 0; i < len; i++) {
      const idx = start + i;
      cells.push(
        <span
          key={i}
          style={{
            display: "inline-block",
            width: "12px",
            height: "16px",
            border: "1px solid #111111",
            textAlign: "center",
            lineHeight: "16px",
            fontSize: "9.5pt",
            fontFamily: '"Times New Roman", Times, serif',
            fontWeight: "bold",
            marginLeft: i === 0 ? "0" : "-1px",
            color: "#000000",
          }}
        >
          {chars[idx] || ""}
        </span>,
      );
    }
    return <span style={{ display: "inline-flex" }}>{cells}</span>;
  };

  return (
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: "6px",
        marginLeft: "6px",
      }}
    >
      {makeGroup(0, group1Len)}
      {group2Len > 0 && makeGroup(group1Len, group2Len)}
    </span>
  );
};

const showVal = (val) => {
  if (val === 0 || val === "0") return "0";
  if (val === false) return "Không";
  if (!val || String(val).trim() === "" || val === "—") return ".......";
  return val;
};

const cleanOrgName = (name) => {
  if (!name) return "";
  return name
    .replace(/^(Đảng bộ|Đảng bộ|Chi bộ cơ sở|Chi bộ bộ phận|Chi bộ)\s+/i, "")
    .trim();
};

export default function MemberDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();

  const [member, setMember] = useState(null);
  const [loading, setLoading] = useState(true);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);

  // State phục vụ xem trước tài liệu/quyết định đính kèm
  const [previewDoc, setPreviewDoc] = useState(null);

  const isBiThu = user?.role === ROLES.BI_THU;
  const isCanBo = user?.role === ROLES.CAN_BO_CHINH_TRI;
  const canEdit =
    (isBiThu && member?.ToChucDangId === user?.orgId) ||
    (isCanBo && member?.ToChucDang?.ParentId === null);

  useEffect(() => {
    fetchMember();
  }, [id]);

  const fetchMember = async () => {
    try {
      setLoading(true);
      const res = await memberApi.getById(id);
      setMember(res.data);
    } catch {
      toast.error("Không thể tải thông tin đảng viên.");
      navigate("/members");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    setDeleting(true);
    try {
      await memberApi.deleteMember(id);
      toast.success("Đã xóa đảng viên thành công.");
      navigate("/members");
    } catch {
      toast.error("Không thể xóa đảng viên.");
    } finally {
      setDeleting(false);
      setDeleteModalOpen(false);
    }
  };

  if (loading) return <LoadingSpinner />;

  if (!member) return null;

  const rankHistories = member.LichSuQuanHam || [];
  const employments = member.QuaTrinhCongTac || [];
  const trainings = member.QuaTrinhDaoTao || [];
  const evaluations = member.DanhGiaDangVien || [];

  return (
    <div
      className="page"
      style={{
        padding: 0,
        backgroundColor: "var(--color-bg-primary)",
        minHeight: "100vh",
        display: "flex",
        flexDirection: "column",
      }}
    >
      {/* Thanh công cụ trên cùng: quay lại, sửa, xóa, in */}
      <DetailToolbar
        member={member}
        canEdit={canEdit}
        id={id}
        navigate={navigate}
        setDeleteModalOpen={setDeleteModalOpen}
      />

      {/* Nội dung chính của phiếu hồ sơ */}
      <div
        className="print-paper-container"
        style={{
          padding: "40px 10px",
          backgroundColor: "var(--color-bg-tertiary)",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          gap: "40px",
          flexGrow: 1,
          width: "100%",
          boxSizing: "border-box",
        }}
      >
        {/* Tờ phiếu dạng số hóa, trình bày theo khổ A4 */}
        <div className="print-paper">
          {/* Phần tiêu đề chỉ dùng khi xem trên web, không xuất hiện lúc in */}
          <div
            className="print-paper-header no-print"
            style={{
              borderBottom: "none",
              paddingBottom: 0,
              marginBottom: "25px",
              display: "flex",
              flexDirection: "column",
              alignItems: "stretch",
            }}
          >
            <div
              style={{
                display: "flex",
                justifyContent: "flex-end",
                fontSize: "11pt",
                lineHeight: "1.6",
                marginBottom: "5px",
                color: "var(--color-text-primary)",
              }}
            >
              <div style={{ textAlign: "left", minWidth: "220px" }}>
                <div>
                  SỐ LÝ LỊCH:{" "}
                  <span className="font-bold">
                    {member.SoLyLich || "..................."}
                  </span>
                </div>
                <div>
                  SỐ THẺ ĐẢNG VIÊN:{" "}
                  <span className="font-bold">
                    {member.SoTheDangVien || "..................."}
                  </span>
                </div>
              </div>
            </div>

            <div
              style={{
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                textAlign: "center",
                width: "100%",
              }}
            >
              <div
                className="print-paper-title"
                style={{
                  fontSize: "24pt",
                  color: "var(--color-text-primary)",
                  fontWeight: "bold",
                  textDecoration: "none",
                  margin: 0,
                  lineHeight: 1.2,
                  letterSpacing: "1px",
                }}
              >
                PHIẾU ĐẢNG VIÊN
              </div>
            </div>
          </div>

          {/* Phần tiêu đề riêng dành cho bản in ra giấy/PDF, theo đúng mẫu phiếu chính thức */}
          <div
            className="print-paper-header print-only-item"
            style={{
              borderBottom: "none",
              paddingBottom: 0,
              marginBottom: "25px",
              display: "flex",
              flexDirection: "column",
              alignItems: "stretch",
            }}
          >
            {/* Dòng tiêu ngữ quốc gia ở trên cùng */}
            <div
              style={{
                display: "flex",
                justifyContent: "center",
                width: "100%",
                marginBottom: "5px",
              }}
            >
              <div
                style={{
                  fontSize: "12pt",
                  fontWeight: "bold",
                  textTransform: "uppercase",
                  letterSpacing: "1px",
                  textDecoration: "underline",
                  color: "#000000",
                }}
              >
                ĐẢNG CỘNG SẢN VIỆT NAM
              </div>
            </div>

            {/* Khối số lý lịch/số thẻ, nằm dưới tiêu ngữ và căn về bên phải */}
            <div
              style={{
                display: "flex",
                justifyContent: "flex-end",
                width: "100%",
                marginBottom: "15px",
              }}
            >
              <div
                style={{
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "flex-start",
                  fontSize: "9.5pt",
                  lineHeight: "1.4",
                  color: "#000000",
                  paddingRight: "5px",
                }}
              >
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    marginBottom: "4px",
                    whiteSpace: "nowrap",
                  }}
                >
                  <span
                    style={{
                      width: "140px",
                      textAlign: "left",
                      display: "inline-block",
                      fontWeight: "normal",
                    }}
                  >
                    SỐ LÝ LỊCH:
                  </span>
                  {renderSplitBoxes(member.SoLyLich, 6, 3)}
                </div>
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    whiteSpace: "nowrap",
                  }}
                >
                  <span
                    style={{
                      width: "140px",
                      textAlign: "left",
                      display: "inline-block",
                      fontWeight: "normal",
                    }}
                  >
                    SỐ THẺ ĐẢNG VIÊN:
                  </span>
                  {renderSplitBoxes(member.SoTheDangVien, 2, 6)}
                </div>
              </div>
            </div>

            {/* Khối giữa chia làm ba cột, có khoảng cách đều giữa các cột */}
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                width: "100%",
                marginTop: "12px",
              }}
            >
              {/* Cột 1 (40% bên trái): thông tin phân cấp tổ chức Đảng */}
              <div
                style={{
                  width: "40%",
                  fontSize: "10pt",
                  lineHeight: "1.5",
                  fontFamily: '"Times New Roman", Times, serif',
                  color: "#000000",
                  textAlign: "left",
                }}
              >
                <div
                  style={{
                    fontWeight: "bold",
                    textAlign: "center",
                    width: "100%",
                    marginBottom: "8px",
                  }}
                >
                  ĐẢNG BỘ QUÂN ĐỘI
                </div>
                <div style={{ marginBottom: "2px" }}>
                  <span>ĐẢNG BỘ: </span>
                  <span
                    style={{
                      borderBottom: "1px solid #111111",
                      fontWeight: "bold",
                    }}
                  >
                    {showVal(cleanOrgName(member.ToChucDang?.level1))}
                  </span>
                </div>
                <div style={{ marginBottom: "2px" }}>
                  <span>ĐẢNG BỘ: </span>
                  <span
                    style={{
                      borderBottom: "1px solid #111111",
                      fontWeight: "bold",
                    }}
                  >
                    {showVal(cleanOrgName(member.ToChucDang?.level2))}
                  </span>
                </div>
                <div style={{ marginBottom: "2px" }}>
                  <span>ĐẢNG BỘ, CHI BỘ CƠ SỞ: </span>
                  <span
                    style={{
                      borderBottom: "1px solid #111111",
                      fontWeight: "bold",
                    }}
                  >
                    {showVal(
                      cleanOrgName(
                        member.ToChucDang?.level3 || member.ToChucDang?.Ten,
                      ),
                    )}
                  </span>
                </div>
                <div style={{ marginBottom: "2px" }}>
                  <span>ĐẢNG BỘ BỘ PHẬN: </span>
                  <span
                    style={{
                      borderBottom: "1px solid #111111",
                      fontWeight: "bold",
                    }}
                  >
                    {showVal(null)}
                  </span>
                </div>
                <div style={{ marginBottom: "2px" }}>
                  <span>CHI BỘ: </span>
                  <span
                    style={{
                      borderBottom: "1px solid #111111",
                      fontWeight: "bold",
                    }}
                  >
                    {showVal(cleanOrgName(member.ToChucDang?.Ten))}
                  </span>
                </div>
              </div>

              {/* Cột 2 (32% ở giữa): tiêu đề lớn "PHIẾU ĐẢNG VIÊN" */}
              <div
                style={{
                  width: "32%",
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <div
                  style={{
                    fontSize: "28pt",
                    fontWeight: "bold",
                    textAlign: "center",
                    lineHeight: "1.1",
                    color: "#000000",
                    letterSpacing: "2px",
                  }}
                >
                  PHIẾU
                  <br />
                  ĐẢNG VIÊN
                </div>
              </div>

              {/* Cột 3 (28% bên phải): khung dán ảnh 3x4 */}
              <div
                style={{
                  width: "28%",
                  display: "flex",
                  justifyContent: "flex-end",
                }}
              >
                <div
                  style={{
                    width: "30mm",
                    height: "40mm",
                    border: "1px solid #111111",
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: "10pt",
                    backgroundColor: "#ffffff",
                    color: "#000000",
                    lineHeight: "1.3",
                  }}
                >
                  <div>Ảnh</div>
                  <div>(3x4)</div>
                </div>
              </div>
            </div>
          </div>

          {/* Các khối thông tin chi tiết còn lại của hồ sơ */}
          <DetailPersonalInfo member={member} />

          <DetailPartyInfo member={member} />

          <DetailHistoryTables
            member={member}
            employments={employments}
            trainings={trainings}
            rankHistories={rankHistories}
            evaluations={evaluations}
            setPreviewDoc={setPreviewDoc}
          />

          <DetailFamilyTable member={member} />

          <DetailEconomicInfo member={member} />
        </div>

        {/* Hộp thoại xác nhận xóa đảng viên */}
        <ConfirmModal
          isOpen={deleteModalOpen}
          title="Xóa đảng viên"
          message={`Bạn có chắc chắn muốn xóa đảng viên "${member.HoTenDangDung}"? Thao tác này không thể hoàn tác.`}
          confirmText="Xóa"
          onConfirm={handleDelete}
          onCancel={() => setDeleteModalOpen(false)}
          loading={deleting}
        />

        {/* Modal xem trước tài liệu/quyết định đính kèm */}
        <DecisionPreviewModal
          isOpen={!!previewDoc}
          decisionId={previewDoc?.quyetDinhId}
          decision={
            previewDoc?.quyetDinhId
              ? null
              : previewDoc
                ? {
                    soQuyetDinh: previewDoc.soQuyetDinh || "Tài liệu",
                    tenQuyetDinh: previewDoc.name || "Xem chi tiết",
                    loaiQuyetDinh:
                      previewDoc.loaiQuyetDinh || "Văn bản / Chứng chỉ",
                    ngayBanHanh: previewDoc.ngayBanHanh || new Date(),
                    taiLieuUrl: previewDoc.fileUrl,
                    taiLieuName: previewDoc.name,
                  }
                : null
          }
          onClose={() => setPreviewDoc(null)}
        />
      </div>
    </div>
  );
}
