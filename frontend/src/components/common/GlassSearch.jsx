import { FiSearch, FiX } from "../icons";

export default function GlassSearch({
  value,
  onChange,
  placeholder = "Tìm kiếm...",
  width = "320px",
  style,
  className = "",
  disabled = false,
}) {
  return (
    <div
      className={`search-box ${className}`}
      style={{
        position: "relative",
        width: width,
        display: "inline-flex",
        alignItems: "center",
        ...style,
      }}
    >
      <FiSearch 
        className="search-icon" 
        style={{ 
          position: "absolute",
          left: "12px",
          top: "50%",
          transform: "translateY(-50%)",
          color: "rgba(148, 163, 184, 0.8)",
          fontSize: "16px",
          pointerEvents: "none"
        }} 
      />
      <input
        type="text"
        className="form-input form-input-sm"
        style={{
          width: "100%",
          paddingLeft: "34px",
          paddingRight: value ? "30px" : "10px",
          borderColor: "rgba(148, 163, 184, 0.45)",
          height: "34px",
        }}
        placeholder={placeholder}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        disabled={disabled}
      />
      {value && (
        <button
          type="button"
          onClick={() => onChange("")}
          style={{
            position: "absolute",
            right: "10px",
            background: "none",
            border: "none",
            color: "var(--color-text-secondary)",
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: "2px",
            borderRadius: "50%",
            transition: "background-color var(--transition-fast)"
          }}
          onMouseEnter={(e) => e.currentTarget.style.backgroundColor = "rgba(0,0,0,0.05)"}
          onMouseLeave={(e) => e.currentTarget.style.backgroundColor = "transparent"}
          title="Xóa tìm kiếm"
        >
          <FiX style={{ fontSize: "14px" }} />
        </button>
      )}
    </div>
  );
}
