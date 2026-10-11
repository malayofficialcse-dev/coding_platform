import React from "react";
import { FaFileExcel } from "react-icons/fa";

export default function ExportExcelButton({
  onClick,
  loading = false,
  disabled = false,
  label = "Export to Excel",
  size = "md",
  variant = "success",
  className = "",
  style = {},
  title = "Export data to Excel spreadsheet",
}) {
  const sizeClasses = {
    sm: "btn-sm py-1 px-2 fs-7",
    md: "py-2 px-3",
    lg: "btn-lg py-2 px-4",
  };

  const isDarkTheme = variant === "dark-excel";

  const defaultBtnStyle = isDarkTheme
    ? {
        background: "linear-gradient(135deg, #107c41 0%, #15803d 100%)",
        color: "#ffffff",
        border: "1px solid rgba(255, 255, 255, 0.15)",
        fontWeight: "600",
        borderRadius: "8px",
        boxShadow: "0 2px 6px rgba(16, 124, 65, 0.3)",
        transition: "all 0.2s ease-in-out",
        display: "inline-flex",
        alignItems: "center",
        gap: "8px",
        cursor: disabled || loading ? "not-allowed" : "pointer",
        ...style,
      }
    : {
        fontWeight: "600",
        borderRadius: "8px",
        display: "inline-flex",
        alignItems: "center",
        gap: "8px",
        boxShadow: "0 2px 5px rgba(0,0,0,0.1)",
        ...style,
      };

  const btnClass = isDarkTheme
    ? `btn ${sizeClasses[size] || ""} ${className}`
    : `btn btn-success ${sizeClasses[size] || ""} ${className}`;

  return (
    <button
      type="button"
      className={btnClass}
      style={defaultBtnStyle}
      onClick={onClick}
      disabled={disabled || loading}
      title={title}
    >
      {loading ? (
        <span
          className="spinner-border spinner-border-sm"
          role="status"
          aria-hidden="true"
        />
      ) : (
        <FaFileExcel style={{ fontSize: size === "sm" ? "14px" : "16px" }} />
      )}
      <span>{loading ? "Exporting…" : label}</span>
    </button>
  );
}
