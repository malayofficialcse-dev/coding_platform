import React from "react";

const BADGE_STYLES = {
  "1st": {
    bg: "rgba(16, 185, 129, 0.12)",
    color: "#059669",
    border: "1px solid rgba(16, 185, 129, 0.35)",
    label: "1st",
    desc: "1st degree connection • You are directly following this user",
  },
  "2nd": {
    bg: "rgba(59, 130, 246, 0.12)",
    color: "#2563eb",
    border: "1px solid rgba(59, 130, 246, 0.35)",
    label: "2nd",
    desc: "2nd degree connection • Connected through mutual peers",
  },
  "3rd+": {
    bg: "rgba(139, 92, 246, 0.12)",
    color: "#7c3aed",
    border: "1px solid rgba(139, 92, 246, 0.35)",
    label: "3rd+",
    desc: "3rd+ degree connection • Connected through your extended campus network",
  },
  Self: {
    bg: "rgba(107, 114, 128, 0.1)",
    color: "#4b5563",
    border: "1px solid rgba(107, 114, 128, 0.25)",
    label: "You",
    desc: "This is your own profile",
  },
  None: {
    bg: "rgba(156, 163, 175, 0.1)",
    color: "#6b7280",
    border: "1px solid rgba(156, 163, 175, 0.2)",
    label: "Out of Network",
    desc: "Not yet connected in campus graph",
  },
};

export default function ConnectionBadge({ degree = "None", size = "sm", onClick, className = "" }) {
  if (!degree || degree === "None") return null;

  const styleConfig = BADGE_STYLES[degree] || BADGE_STYLES.None;
  const isClickable = typeof onClick === "function" && degree !== "Self" && degree !== "None";

  const padding = size === "xs" ? "1px 5px" : size === "md" ? "3px 10px" : "2px 7px";
  const fontSize = size === "xs" ? "0.68rem" : size === "md" ? "0.82rem" : "0.74rem";

  return (
    <span
      onClick={isClickable ? onClick : undefined}
      title={styleConfig.desc}
      className={`connection-badge ${className}`}
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: "4px",
        padding,
        fontSize,
        fontWeight: 700,
        borderRadius: "999px",
        background: styleConfig.bg,
        color: styleConfig.color,
        border: styleConfig.border,
        letterSpacing: "0.02em",
        cursor: isClickable ? "pointer" : "default",
        userSelect: "none",
        transition: "all 0.15s ease",
        verticalAlign: "middle",
      }}
    >
      <span
        style={{
          width: "5px",
          height: "5px",
          borderRadius: "50%",
          backgroundColor: styleConfig.color,
          display: "inline-block",
        }}
      />
      {styleConfig.label}
    </span>
  );
}
