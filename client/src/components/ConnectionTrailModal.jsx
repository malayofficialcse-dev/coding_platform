import React from "react";
import { Link } from "react-router-dom";
import { FaRoute, FaTimes, FaArrowRight, FaUserFriends, FaCheckCircle } from "react-icons/fa";

const DEFAULT_AVATAR =
  "https://static.vecteezy.com/system/resources/previews/018/742/015/original/minimal-profile-account-symbol-user-interface-theme-3d-icon-rendering-illustration-isolated-in-transparent-background-png.png";

export default function ConnectionTrailModal({ isOpen, onClose, targetUser, trail = [], degree = "None", mutualCount = 0 }) {
  if (!isOpen) return null;

  return (
    <div
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: "rgba(15, 23, 42, 0.65)",
        backdropFilter: "blur(6px)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        zIndex: 1050,
        padding: "16px",
      }}
      onClick={onClose}
    >
      <div
        style={{
          background: "#ffffff",
          borderRadius: "16px",
          width: "100%",
          maxWidth: "600px",
          boxShadow: "0 20px 40px -15px rgba(0,0,0,0.25)",
          border: "1px solid rgba(226, 232, 240, 0.9)",
          overflow: "hidden",
          animation: "modalFadeIn 0.2s ease-out",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div
          style={{
            padding: "18px 24px",
            borderBottom: "1px solid #e2e8f0",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            background: "#f8fafc",
          }}
        >
          <div className="d-flex align-items-center gap-2">
            <div
              style={{
                width: 34,
                height: 34,
                borderRadius: "8px",
                background: "linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color: "#fff",
              }}
            >
              <FaRoute size={16} />
            </div>
            <div>
              <h6 style={{ margin: 0, fontWeight: 700, color: "#0f172a", fontSize: "1rem" }}>
                Campus Graph Connection Path
              </h6>
              <span style={{ fontSize: "0.78rem", color: "#64748b" }}>
                How you are connected to {targetUser?.name || targetUser?.username}
              </span>
            </div>
          </div>
          <button
            onClick={onClose}
            style={{
              background: "transparent",
              border: "none",
              cursor: "pointer",
              color: "#94a3b8",
              fontSize: "1.1rem",
              padding: "4px",
            }}
          >
            <FaTimes />
          </button>
        </div>

        {/* Body */}
        <div style={{ padding: "24px" }}>
          {/* Summary Banner */}
          <div
            style={{
              background: degree === "1st" ? "#ecfdf5" : degree === "2nd" ? "#eff6ff" : "#f5f3ff",
              border: `1px solid ${degree === "1st" ? "#a7f3d0" : degree === "2nd" ? "#bfdbfe" : "#ddd6fe"}`,
              borderRadius: "12px",
              padding: "12px 16px",
              marginBottom: "24px",
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
            }}
          >
            <div className="d-flex align-items-center gap-2">
              <FaCheckCircle color={degree === "1st" ? "#059669" : degree === "2nd" ? "#2563eb" : "#7c3aed"} />
              <span style={{ fontSize: "0.88rem", fontWeight: 600, color: "#1e293b" }}>
                {degree === "1st"
                  ? "Direct 1st Degree Connection"
                  : degree === "2nd"
                  ? "Connected through Mutual Campus Peers (2nd Degree)"
                  : degree === "3rd+"
                  ? "Extended Campus Network (3rd+ Degree)"
                  : "Not yet directly connected"}
              </span>
            </div>
            {mutualCount > 0 && (
              <span
                style={{
                  fontSize: "0.76rem",
                  fontWeight: 600,
                  color: "#475569",
                  background: "rgba(255,255,255,0.7)",
                  padding: "3px 8px",
                  borderRadius: "6px",
                }}
              >
                <FaUserFriends style={{ marginRight: 4 }} />
                {mutualCount} mutual
              </span>
            )}
          </div>

          {/* Connection Chain Visualization */}
          {trail && trail.length > 0 ? (
            <div style={{ position: "relative", padding: "10px 0" }}>
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  flexWrap: "wrap",
                  gap: "12px",
                }}
              >
                {trail.map((node, index) => {
                  const isFirst = index === 0;
                  const isLast = index === trail.length - 1;
                  const isIntermediate = !isFirst && !isLast;

                  return (
                    <React.Fragment key={node.id || index}>
                      {/* Node Card */}
                      <div
                        style={{
                          display: "flex",
                          flexDirection: "column",
                          alignItems: "center",
                          textAlign: "center",
                          minWidth: "90px",
                          maxWidth: "110px",
                        }}
                      >
                        <div
                          style={{
                            width: 52,
                            height: 52,
                            borderRadius: "50%",
                            padding: "3px",
                            background: isFirst
                              ? "linear-gradient(135deg, #10b981, #059669)"
                              : isLast
                              ? "linear-gradient(135deg, #3b82f6, #1d4ed8)"
                              : "linear-gradient(135deg, #8b5cf6, #6366f1)",
                            boxShadow: "0 4px 10px rgba(0,0,0,0.1)",
                            position: "relative",
                          }}
                        >
                          <img
                            src={node.profileImage || DEFAULT_AVATAR}
                            alt={node.name}
                            style={{
                              width: "100%",
                              height: "100%",
                              borderRadius: "50%",
                              objectFit: "cover",
                              background: "#fff",
                            }}
                          />
                          <span
                            style={{
                              position: "absolute",
                              bottom: -4,
                              right: -4,
                              background: isFirst ? "#059669" : isLast ? "#2563eb" : "#7c3aed",
                              color: "#fff",
                              fontSize: "0.62rem",
                              fontWeight: 800,
                              borderRadius: "999px",
                              padding: "1px 5px",
                              border: "2px solid #fff",
                            }}
                          >
                            {isFirst ? "You" : isLast ? "Target" : `${index}°`}
                          </span>
                        </div>

                        <span
                          style={{
                            marginTop: "8px",
                            fontWeight: 700,
                            fontSize: "0.82rem",
                            color: "#0f172a",
                            whiteSpace: "nowrap",
                            overflow: "hidden",
                            textOverflow: "ellipsis",
                            maxWidth: "100%",
                          }}
                        >
                          {isFirst ? "You" : node.name || node.username}
                        </span>

                        <span
                          style={{
                            fontSize: "0.7rem",
                            color: "#64748b",
                            textTransform: "capitalize",
                          }}
                        >
                          {node.role ? node.role.replace("_", " ") : "Member"}
                        </span>

                        {!isFirst && (
                          <Link
                            to={`/profile/${node.id || node._id}`}
                            onClick={onClose}
                            style={{
                              fontSize: "0.68rem",
                              color: "#2563eb",
                              textDecoration: "none",
                              marginTop: "2px",
                              fontWeight: 600,
                            }}
                          >
                            View
                          </Link>
                        )}
                      </div>

                      {/* Arrow Connector between nodes */}
                      {!isLast && (
                        <div
                          style={{
                            display: "flex",
                            flexDirection: "column",
                            alignItems: "center",
                            color: "#94a3b8",
                            flex: 1,
                            minWidth: "24px",
                          }}
                        >
                          <FaArrowRight size={14} color="#60a5fa" />
                          <span style={{ fontSize: "0.65rem", color: "#94a3b8", marginTop: 2 }}>
                            follows
                          </span>
                        </div>
                      )}
                    </React.Fragment>
                  );
                })}
              </div>
            </div>
          ) : (
            <div style={{ textAlign: "center", padding: "20px 0", color: "#64748b" }}>
              No direct path found within 4 degrees. Connect with mutual campus peers to build a bridge!
            </div>
          )}
        </div>

        {/* Footer */}
        <div
          style={{
            padding: "14px 24px",
            borderTop: "1px solid #e2e8f0",
            background: "#f8fafc",
            display: "flex",
            justifyContent: "flex-end",
          }}
        >
          <button
            onClick={onClose}
            className="btn btn-sm btn-outline-secondary"
            style={{ borderRadius: "8px", fontWeight: 600, padding: "6px 16px" }}
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
