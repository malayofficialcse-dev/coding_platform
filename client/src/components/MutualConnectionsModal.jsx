import React from "react";
import { Link } from "react-router-dom";
import { FaUserFriends, FaTimes, FaUserPlus, FaUserMinus } from "react-icons/fa";

const DEFAULT_AVATAR =
  "https://static.vecteezy.com/system/resources/previews/018/742/015/original/minimal-profile-account-symbol-user-interface-theme-3d-icon-rendering-illustration-isolated-in-transparent-background-png.png";

export default function MutualConnectionsModal({
  isOpen,
  onClose,
  targetUserName = "User",
  mutualUsers = [],
  onFollowToggle,
  followingIds = [],
}) {
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
          maxWidth: "520px",
          boxShadow: "0 20px 40px -15px rgba(0,0,0,0.25)",
          border: "1px solid rgba(226, 232, 240, 0.9)",
          overflow: "hidden",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div
          style={{
            padding: "16px 20px",
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
                width: 32,
                height: 32,
                borderRadius: "8px",
                background: "linear-gradient(135deg, #10b981 0%, #059669 100%)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color: "#fff",
              }}
            >
              <FaUserFriends size={16} />
            </div>
            <div>
              <h6 style={{ margin: 0, fontWeight: 700, color: "#0f172a", fontSize: "0.96rem" }}>
                Mutual Connections ({mutualUsers.length})
              </h6>
              <span style={{ fontSize: "0.76rem", color: "#64748b" }}>
                People you and {targetUserName} both know
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

        {/* List of Mutual Friends */}
        <div style={{ maxHeight: "380px", overflowY: "auto", padding: "12px 16px" }}>
          {mutualUsers.length === 0 ? (
            <div style={{ textAlign: "center", padding: "30px 16px", color: "#64748b" }}>
              No mutual connections found yet.
            </div>
          ) : (
            mutualUsers.map((person) => {
              const personId = person.id || person._id;
              const isFollowing = followingIds.includes(personId);

              return (
                <div
                  key={personId}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    padding: "10px 12px",
                    borderRadius: "10px",
                    marginBottom: "8px",
                    background: "#f8fafc",
                    border: "1px solid #f1f5f9",
                    transition: "all 0.15s ease",
                  }}
                >
                  <Link
                    to={`/profile/${personId}`}
                    onClick={onClose}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "12px",
                      textDecoration: "none",
                      color: "inherit",
                      flex: 1,
                    }}
                  >
                    <img
                      src={person.profileImage || DEFAULT_AVATAR}
                      alt={person.name}
                      style={{
                        width: 40,
                        height: 40,
                        borderRadius: "50%",
                        objectFit: "cover",
                        border: "1px solid #e2e8f0",
                      }}
                    />
                    <div>
                      <div style={{ fontWeight: 700, fontSize: "0.88rem", color: "#0f172a" }}>
                        {person.name || person.username}
                      </div>
                      <div style={{ fontSize: "0.74rem", color: "#64748b" }}>
                        {person.college || person.role?.replace("_", " ") || "Member"}
                      </div>
                    </div>
                  </Link>

                  {typeof onFollowToggle === "function" && (
                    <button
                      onClick={() => onFollowToggle(personId, isFollowing)}
                      className={`btn btn-sm ${isFollowing ? "btn-outline-secondary" : "btn-primary"}`}
                      style={{
                        fontSize: "0.74rem",
                        padding: "4px 10px",
                        borderRadius: "6px",
                        fontWeight: 600,
                        display: "flex",
                        alignItems: "center",
                        gap: "5px",
                      }}
                    >
                      {isFollowing ? (
                        <>
                          <FaUserMinus size={11} /> Unfollow
                        </>
                      ) : (
                        <>
                          <FaUserPlus size={11} /> Follow
                        </>
                      )}
                    </button>
                  )}
                </div>
              );
            })
          )}
        </div>

        {/* Footer */}
        <div
          style={{
            padding: "12px 20px",
            borderTop: "1px solid #e2e8f0",
            background: "#f8fafc",
            display: "flex",
            justifyContent: "flex-end",
          }}
        >
          <button
            onClick={onClose}
            className="btn btn-sm btn-secondary"
            style={{ borderRadius: "8px", fontWeight: 600, padding: "5px 14px" }}
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
