import { useState, useEffect } from "react";
import { FiLayers } from "../../components/icons";
import toast from "react-hot-toast";
import { useAuth } from "../../contexts/AuthContext";
import { ROLES } from "../../utils/constants";
import { buildOrgTree } from "../../utils/helpers";
import orgApi from "../../api/orgApi";
import LoadingSpinner from "../../components/common/LoadingSpinner";
import EmptyState from "../../components/common/EmptyState";
import ConfirmModal from "../../components/common/ConfirmModal";
import GlassSelect from "../../components/common/GlassSelect";
import PageHeader from "../../components/common/PageHeader";

export default function OrgManagePage() {
  const { user } = useAuth();
  const isCanBo = user?.role === ROLES.CAN_BO_CHINH_TRI;

  const [orgs, setOrgs] = useState([]);
  const [orgTree, setOrgTree] = useState([]);
  const [loading, setLoading] = useState(true);

  // State cho form thêm/sửa tổ chức
  const [showForm, setShowForm] = useState(false);
  const [editingOrg, setEditingOrg] = useState(null);
  const [formData, setFormData] = useState({ name: "", parentId: "" });
  const [saving, setSaving] = useState(false);

  // State cho thao tác xóa
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleting, setDeleting] = useState(false);

  // Trạng thái mở/đóng của từng node trong cây tổ chức
  const [expanded, setExpanded] = useState({});

  useEffect(() => {
    fetchOrgs();
  }, []);

  const fetchOrgs = async () => {
    try {
      setLoading(true);
      const res = await orgApi.getAll();
      const data = res.data || [];
      setOrgs(data);
      setOrgTree(buildOrgTree(data));
      // Mặc định mở hết tất cả các nhánh khi vừa tải xong
      const expMap = {};
      data.forEach((o) => {
        expMap[o.id] = true;
      });
      setExpanded(expMap);
    } catch {
      toast.error("Không thể tải danh sách tổ chức.");
    } finally {
      setLoading(false);
    }
  };

  const toggleExpand = (id) => {
    setExpanded((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const openAddForm = (parentId = "") => {
    setEditingOrg(null);
    setFormData({ name: "", parentId: parentId || "" });
    setShowForm(true);
  };

  const openEditForm = (org) => {
    setEditingOrg(org);
    setFormData({ name: org.name, parentId: org.parentId || "" });
    setShowForm(true);
  };

  const cancelForm = () => {
    setShowForm(false);
    setEditingOrg(null);
    setFormData({ name: "", parentId: "" });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.name.trim()) {
      toast.error("Tên tổ chức không được để trống.");
      return;
    }

    setSaving(true);
    try {
      const payload = {
        name: formData.name.trim(),
        parentId: formData.parentId || null,
      };

      if (editingOrg) {
        await orgApi.update(editingOrg.id, payload);
        toast.success("Cập nhật tổ chức thành công.");
      } else {
        await orgApi.create(payload);
        toast.success("Thêm tổ chức thành công.");
      }
      cancelForm();
      await fetchOrgs();
    } catch (err) {
      toast.error(err.message || "Có lỗi xảy ra.");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await orgApi.delete(deleteTarget.id);
      toast.success("Đã xóa tổ chức.");
      await fetchOrgs();
    } catch (err) {
      toast.error(
        err.message ||
          "Không thể xóa tổ chức. Có thể vẫn còn đảng viên thuộc tổ chức này.",
      );
    } finally {
      setDeleting(false);
      setDeleteTarget(null);
    }
  };

  // Tất cả các row dùng paddingLeft=16 cố định (không nhân level)
  // Mỗi children container marginLeft=24 → tích lũy tự nhiên theo độ sâu
  // border-left của container canh với tâm toggle cha (16 + 8 = 24)
  const ROW_PAD = 16;
  const CHILD_MARGIN = 24; // = ROW_PAD + toggle_width/2 (8)

  const renderNode = (node, level = 0) => {
    const hasChildren = node.children && node.children.length > 0;
    const isExpanded = expanded[node.id];

    return (
      <div key={node.id}>
        {/* Hàng hiển thị của một tổ chức */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "10px",
            minHeight: level === 0 ? "44px" : "38px",
            paddingTop: "6px",
            paddingBottom: "6px",
            paddingRight: "16px",
            paddingLeft: `${ROW_PAD}px`,
            borderBottom: "1px solid var(--color-border-light)",
            cursor: hasChildren ? "pointer" : "default",
            userSelect: "none",
          }}
          onClick={() => hasChildren && toggleExpand(node.id)}
        >
          {/* Toggle [+]/[−] hoặc dot • */}
          {hasChildren ? (
            <span
              style={{
                flexShrink: 0,
                width: "16px",
                height: "16px",
                border: "1px solid var(--color-border)",
                borderRadius: "3px",
                display: "inline-flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: "12px",
                fontWeight: "700",
                color: "var(--color-text-muted)",
                background: "var(--color-bg-secondary)",
                lineHeight: 1,
              }}
            >
              {isExpanded ? "−" : "+"}
            </span>
          ) : (
            <span
              style={{
                flexShrink: 0,
                width: "16px",
                height: "16px",
                display: "inline-flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <span
                style={{
                  width: "5px",
                  height: "5px",
                  borderRadius: "50%",
                  background: "var(--color-text-muted)",
                  opacity: 0.45,
                }}
              />
            </span>
          )}

          {/* Tên đầy đủ của tổ chức Đảng */}
          <span
            style={{
              flex: 1,
              fontWeight: level === 0 ? 700 : level === 1 ? 600 : 500,
              fontSize: level === 0 ? "15px" : "14px",
              color: "var(--color-text-primary)",
            }}
          >
            {node.name}
          </span>

          {/* Badge số con khi đang đóng */}
          {hasChildren && !isExpanded && (
            <span
              style={{
                fontSize: "11px",
                color: "var(--color-text-muted)",
                flexShrink: 0,
                padding: "1px 8px",
                borderRadius: "10px",
                border: "1px solid var(--color-border-light)",
              }}
            >
              {node.children.length} đơn vị
            </span>
          )}

          {/* Nút thao tác — chỉ CAN_BO */}
          {isCanBo && (
            <div
              style={{ display: "flex", gap: "4px", flexShrink: 0 }}
              onClick={(e) => e.stopPropagation()}
            >
              <button
                className="btn btn-outline btn-xs"
                onClick={() => openAddForm(node.id)}
              >
                Thêm cấp dưới
              </button>
              <button
                className="btn btn-outline btn-xs"
                onClick={() => openEditForm(node)}
              >
                Sửa
              </button>
              <button
                className="btn btn-outline btn-xs"
                style={{
                  color: "var(--color-error)",
                  borderColor: "var(--color-error)",
                }}
                onClick={() => setDeleteTarget(node)}
              >
                Xóa
              </button>
            </div>
          )}
        </div>

        {/* Children — border-left tạo đường dọc canh với tâm toggle cha */}
        {hasChildren && isExpanded && (
          <div
            style={{
              borderLeft: "1px solid var(--color-border)",
              marginLeft: `${CHILD_MARGIN}px`,
            }}
          >
            {node.children.map((child) => renderNode(child, level + 1))}
          </div>
        )}
      </div>
    );
  };

  // Danh sách tổ chức cha để chọn trong dropdown — khi đang sửa thì phải loại bỏ
  // chính nó và các tổ chức con cháu để tránh chọn nhầm gây vòng lặp cha-con
  const getParentOptions = () => {
    if (!editingOrg) return orgs;

    const getDescendantIds = (id) => {
      const ids = [id];
      const children = orgs.filter((o) => o.parentId === id);
      children.forEach((c) => {
        ids.push(...getDescendantIds(c.id));
      });
      return ids;
    };

    const excludeIds = getDescendantIds(editingOrg.id);
    return orgs.filter((o) => !excludeIds.includes(o.id));
  };

  if (loading) {
    return <LoadingSpinner />;
  }

  return (
    <div className="page">
      <PageHeader
        title="Tổ chức Đảng"
        actions={
          isCanBo ? (
            <button className="btn btn-primary" onClick={() => openAddForm()}>
              Thêm tổ chức
            </button>
          ) : null
        }
      />

      {/* Form thêm/sửa tổ chức */}
      {showForm && isCanBo && (
        <div
          className="rank-form"
          style={{ marginBottom: "var(--spacing-xl)" }}
        >
          <h4 className="rank-form-title">
            {editingOrg ? "Chỉnh sửa tổ chức" : "Thêm tổ chức mới"}
          </h4>
          <form onSubmit={handleSubmit}>
            <div className="form-grid">
              <div className="form-group">
                <label className="form-label">Tên tổ chức *</label>
                <input
                  type="text"
                  className="form-input"
                  placeholder="Nhập tên tổ chức"
                  value={formData.name}
                  onChange={(e) =>
                    setFormData((f) => ({ ...f, name: e.target.value }))
                  }
                  autoFocus
                />
              </div>
              <div className="form-group">
                <label className="form-label">Tổ chức cha</label>
                <GlassSelect
                  value={formData.parentId}
                  onChange={(val) =>
                    setFormData((f) => ({ ...f, parentId: val }))
                  }
                  options={getParentOptions().map((o) => ({
                    id: o.id,
                    name: o.name,
                  }))}
                  placeholder="Không có (cấp cao nhất)"
                />
              </div>
            </div>
            <div className="rank-form-actions">
              <button
                type="submit"
                className="btn btn-primary btn-sm"
                disabled={saving}
              >
                {saving ? "Đang lưu..." : "Lưu"}
              </button>
              <button
                type="button"
                className="btn btn-outline btn-sm"
                onClick={cancelForm}
                disabled={saving}
              >
                Hủy
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Sơ đồ cây tổ chức */}
      <div className="card">
        <div className="card-header">
          <h3 className="card-title">Cơ cấu tổ chức</h3>
          <span
            className="text-muted"
            style={{ fontSize: "var(--font-size-sm)" }}
          >
            Tổng: {orgs.length} tổ chức
          </span>
        </div>

        {orgTree.length === 0 ? (
          <EmptyState
            icon={FiLayers}
            title="Chưa có tổ chức nào"
            message="Hệ thống chưa có tổ chức Đảng nào được tạo."
          />
        ) : (
          <div style={{ padding: "0" }}>
            {orgTree.map((node) => renderNode(node))}
          </div>
        )}
      </div>

      {/* Hộp thoại xác nhận xóa */}
      <ConfirmModal
        isOpen={!!deleteTarget}
        title="Xóa tổ chức"
        message={`Bạn có chắc chắn muốn xóa tổ chức "${deleteTarget?.name}"? Không thể xóa nếu tổ chức còn đảng viên.`}
        confirmText="Xóa"
        onConfirm={handleDelete}
        onCancel={() => setDeleteTarget(null)}
        loading={deleting}
      />
    </div>
  );
}
