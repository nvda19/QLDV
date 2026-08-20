import React, { useState } from 'react';
import { FiArrowLeft, FiPrinter, FiEdit, FiTrash2, FiDownload } from '../icons';
import toast from 'react-hot-toast';
import memberApi from '../../api/memberApi';
import { downloadBlob } from '../../utils/helpers';

export default function DetailToolbar({
  member,
  canEdit,
  id,
  navigate,
  setDeleteModalOpen
}) {
  const [exporting, setExporting] = useState(false);

  const handleExportWord = async () => {
    setExporting(true);
    try {
      const res = await memberApi.downloadWord(id);
      const blob = res instanceof Blob ? res : new Blob([res], {
        type: "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
      });
      downloadBlob(blob, `Phieu_DangVien_${member.HoTenDangDung}.docx`);
      toast.success('Đã tải Phiếu đảng viên');
    } catch {
      toast.error('Không thể xuất file Word');
    } finally {
      setExporting(false);
    }
  };

  return (
    <div
      className="print-modal-toolbar no-print"
      style={{
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        padding: "var(--spacing-md) var(--spacing-xl)",
        backgroundColor: "var(--color-bg-secondary)",
        borderBottom: "1px solid var(--color-border)",
        position: "sticky",
        top: 0,
        zIndex: 100,
        boxShadow: "var(--shadow-sm)",
        width: "100%",
        boxSizing: "border-box",
      }}
    >
      <div style={{ display: "flex", gap: "var(--spacing-md)" }}>
        <button
          className="btn btn-outline btn-sm"
          onClick={() => navigate("/members")}
        >
          Quay lại danh sách
        </button>
      </div>
      <div
        className="toolbar-title font-bold text-accent"
        style={{ fontSize: "var(--font-size-md)" }}
      >
        Hồ Sơ Đảng Viên: {member.HoTenDangDung}
      </div>
      <div style={{ display: "flex", gap: "var(--spacing-md)" }}>
        <button
          className="btn btn-outline btn-sm"
          onClick={handleExportWord}
          disabled={exporting}
        >
          {exporting ? 'Đang xuất...' : 'Tải Word (.docx)'}
        </button>
        <button
          className="btn btn-accent btn-sm"
          onClick={() => window.print()}
        >
          In phiếu đảng viên
        </button>
        {canEdit && (
          <>
            <button
              className="btn btn-primary btn-sm"
              onClick={() => navigate(`/members/${id}/edit`)}
            >
              Chỉnh sửa hồ sơ
            </button>
            <button
              className="btn btn-danger btn-sm"
              onClick={() => setDeleteModalOpen(true)}
            >
              Xóa
            </button>
          </>
        )}
      </div>
    </div>
  );
}
