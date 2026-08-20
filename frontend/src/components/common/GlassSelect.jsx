import { useState, useRef, useEffect } from "react";
import { FiChevronDown } from "../icons";

// Loại bỏ các ký tự vẽ khung/cây thư mục (├─, │, └, v.v.) hay lẫn trong dữ liệu tên tổ chức, và dấu gạch ngang thừa ở 2 đầu chuỗi
const cleanText = (text) => {
  if (text === null || text === undefined) return "";
  const str = String(text);
  // Xóa các ký tự kẻ khung, đường nhánh, dấu gạch dọc và các loại gạch ngang
  let cleaned = str.replace(/[├│└|—\-–]+\s*/g, "").trim();
  cleaned = cleaned.replace(/^[\s—\-–]+|[\s—\-–]+$/g, "").trim();
  return cleaned;
};

export default function GlassSelect({
  value,
  onChange,
  options = [],
  placeholder = "Chọn...",
  style,
  className = "",
  disabled = false,
  showEmptyOption = true,
  size = "medium", // "small" or "medium"
}) {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);

  useEffect(() => {
    function handleClickOutside(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Đưa options về cùng một định dạng { id, name } dù đầu vào là chuỗi hay object, đồng thời làm sạch text
  const normalizedOptions = options.map((opt) => {
    if (typeof opt === "object" && opt !== null) {
      const id = opt.id !== undefined ? opt.id : opt.value;
      const rawName = opt.name !== undefined ? opt.name : opt.label;
      return { id, name: cleanText(rawName) };
    }
    return { id: opt, name: cleanText(opt) };
  });

  const cleanedPlaceholder = cleanText(placeholder);
  const selectedOption = normalizedOptions.find((opt) => opt.id === value);
  const displayLabel = selectedOption ? selectedOption.name : cleanedPlaceholder;

  // Tìm chuỗi dài nhất trong các option để dropdown tự co giãn vừa đủ chiều rộng, không bị cắt chữ
  const allTexts = [cleanedPlaceholder, ...normalizedOptions.map((o) => o.name)];
  const longestText = allTexts.reduce((longest, current) => {
    return current.length > longest.length ? current : longest;
  }, "");

  return (
    <div
      ref={dropdownRef}
      className={`glass-select-wrapper ${className}`}
      style={{
        position: "relative",
        display: "inline-grid",
        gridTemplateAreas: '"select"',
        width: "fit-content",
        minWidth: size === "small" ? "120px" : "160px",
        zIndex: isOpen ? 1001 : 2,
        ...style,
      }}
    >
      {/* Phần tử ẩn dùng để "đo" chiều rộng theo option dài nhất, giúp ô select không bị đổi kích thước khi chọn option khác */}
      {(!style || style.width !== "100%") && (
        <div
          style={{
            gridArea: "select",
            visibility: "hidden",
            padding: size === "small" ? "6px 38px 6px 10px" : "10px 38px 10px 14px",
            fontSize: size === "small" ? "var(--font-size-sm)" : "var(--font-size-base)",
            fontFamily: "var(--font-family)",
            whiteSpace: "nowrap",
            pointerEvents: "none",
          }}
        >
          {longestText}
        </div>
      )}

      <button
        type="button"
        className="glass-select-button"
        onClick={() => !disabled && setIsOpen(!isOpen)}
        disabled={disabled}
        style={{
          gridArea: "select",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          width: "100%",
          height: "100%",
          minWidth: "0",
          padding: size === "small" ? "6px 10px" : "10px 14px",
          fontSize: size === "small" ? "var(--font-size-sm)" : "var(--font-size-base)",
          fontFamily: "var(--font-family)",
          color: "var(--color-text-primary)",
          backgroundColor: "var(--color-bg-input)",
          backdropFilter: "var(--backdrop-blur)",
          WebkitBackdropFilter: "var(--backdrop-blur)",
          border: "1px solid rgba(148, 163, 184, 0.65)",
          borderRadius: "var(--radius-md)",
          boxShadow: "0 2px 8px rgba(0, 0, 0, 0.12)",
          cursor: disabled ? "not-allowed" : "pointer",
          transition: "all var(--transition-fast)",
          outline: "none",
          opacity: disabled ? 0.6 : 1,
        }}
        onMouseEnter={(e) => {
          if (!disabled) {
            e.currentTarget.style.borderColor = "var(--color-border-light)";
            e.currentTarget.style.backgroundColor = "var(--color-bg-hover)";
            e.currentTarget.style.boxShadow = "0 4px 12px rgba(0, 0, 0, 0.16)";
          }
        }}
        onMouseLeave={(e) => {
          if (!disabled) {
            e.currentTarget.style.borderColor = "var(--color-border)";
            e.currentTarget.style.backgroundColor = "var(--color-bg-input)";
            e.currentTarget.style.boxShadow = "0 2px 8px rgba(0, 0, 0, 0.12)";
          }
        }}
      >
        <span
          style={{
            whiteSpace: "nowrap",
            overflow: "hidden",
            textOverflow: "ellipsis",
            textAlign: "left",
            marginRight: "10px",
            flex: 1,
          }}
        >
          {displayLabel}
        </span>
        <FiChevronDown
          style={{
            flexShrink: 0,
            opacity: 0.7,
            fontSize: "16px",
            transition: "transform var(--transition-fast)",
            transform: isOpen ? "rotate(180deg)" : "rotate(0deg)",
          }}
        />
      </button>

      {isOpen && (
        <div
          className="glass-select-dropdown"
          style={{
            position: "absolute",
            top: "calc(100% + 6px)",
            left: 0,
            right: 0,
            backgroundColor: "#ffffff",
            border: "1.5px solid rgba(30, 64, 175, 0.35)",
            borderRadius: "var(--radius-md)",
            boxShadow: "0 10px 25px -5px rgba(0, 0, 0, 0.25), 0 8px 10px -6px rgba(0, 0, 0, 0.25)",
            zIndex: 10000,
            maxHeight: "300px",
            overflowY: "auto",
            padding: "4px",
            animation: "fadeIn 0.15s ease-out",
          }}
        >
          {/* Lựa chọn rỗng/mặc định, chỉ hiển thị khi showEmptyOption bật */}
          {showEmptyOption && (
            <div
              className="glass-select-option"
              onClick={() => {
                onChange("");
                setIsOpen(false);
              }}
              style={{
                padding: size === "small" ? "8px 12px" : "10px 14px",
                cursor: "pointer",
                borderRadius: "var(--radius-sm)",
                fontSize: "var(--font-size-sm)",
                color: "var(--color-text-primary)",
                transition: "background-color var(--transition-fast)",
                backgroundColor:
                  value === "" || value === undefined
                    ? "rgba(30, 64, 175, 0.08)"
                    : "transparent",
                fontWeight: value === "" || value === undefined ? "600" : "normal",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor =
                  value === "" || value === undefined
                    ? "rgba(30, 64, 175, 0.12)"
                    : "rgba(30, 64, 175, 0.04)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor =
                  value === "" || value === undefined
                    ? "rgba(30, 64, 175, 0.08)"
                    : "transparent";
              }}
            >
              {cleanedPlaceholder}
            </div>
          )}
          {normalizedOptions.map((opt) => (
            <div
              key={opt.id}
              className="glass-select-option"
              onClick={() => {
                onChange(opt.id);
                setIsOpen(false);
              }}
              style={{
                padding: size === "small" ? "8px 12px" : "10px 14px",
                cursor: "pointer",
                borderRadius: "var(--radius-sm)",
                fontSize: "var(--font-size-sm)",
                color: "var(--color-text-primary)",
                transition: "background-color var(--transition-fast)",
                backgroundColor:
                  value === opt.id ? "rgba(30, 64, 175, 0.08)" : "transparent",
                fontWeight: value === opt.id ? "600" : "normal",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor =
                  value === opt.id
                    ? "rgba(30, 64, 175, 0.12)"
                    : "rgba(30, 64, 175, 0.04)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor =
                  value === opt.id ? "rgba(30, 64, 175, 0.08)" : "transparent";
              }}
            >
              {opt.name}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
