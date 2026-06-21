import React, { useContext, useEffect, useState } from "react";
import { Link, NavLink, useNavigate } from "react-router-dom";
import {
  FaBars,
  FaBell,
  FaBookOpen,
  FaCode,
  FaComments,
  FaFlask,
  FaHome,
  FaInfoCircle,
  FaSearch,
  FaTimes,
  FaUserShield,
} from "react-icons/fa";
import api from "../api/api";
import { AuthContext } from "../contexts/AuthContext";
import NotificationBell from "./NotificationBell";
import ProfileIcon from "../assets/user-solid-full.svg";
import CodeCampus from "../assets/image1.jpeg";

const navItems = [
  { to: "/", label: "Home", icon: FaHome, iconOnly: true },
  { to: "/courses", label: "Courses", icon: FaBookOpen },
  { to: "/exams", label: "Exams", icon: FaFlask },
  { to: "/coding", label: "Coding Problems", icon: FaCode },
  { to: "/about", label: "About", icon: FaInfoCircle },
  { to: "/messages", label: "Messages", icon: FaComments, iconOnly: true },
];

export default function Header() {
  const { user, logout } = useContext(AuthContext);
  const [menuOpen, setMenuOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [users, setUsers] = useState([]);
  const navigate = useNavigate();

  useEffect(() => {
    api.get("/users/all").then((res) => setUsers(res.data || []));
  }, []);

  const filtered = users.filter((u) =>
    (u.name || u.username || "").toLowerCase().includes(query.trim().toLowerCase())
  );

  const profileImage = user?.profileImage || ProfileIcon;

  const closeAndNavigate = (path) => {
    setMenuOpen(false);
    setSearchOpen(false);
    navigate(path);
  };

  return (
    <header
      style={{
        width: "100%",
        minHeight: 68,
        background: "#ffffff",
        borderBottom: "1px solid #d9e2ec",
        position: "sticky",
        top: 0,
        zIndex: 500,
        display: "flex",
        alignItems: "center",
        padding: "0 18px",
        boxShadow: "0 2px 8px rgba(15, 23, 42, 0.08)",
      }}
    >
      <Link
        to="/"
        style={{
          display: "flex",
          alignItems: "center",
          textDecoration: "none",
          marginRight: 30,
        }}
      >
        <img
          src={CodeCampus}
          alt="CodeCampus"
          style={{
            height: 48,
            width: 48,
            borderRadius: 3,
            marginRight: 10,
            boxShadow: "0 2px 6px rgba(15, 23, 42, 0.15)",
            objectFit: "cover",
          }}
        />
        <span style={{ fontSize: 22, fontWeight: 700, color: "#1d4ed8" }}>
          Code Campus
        </span>
      </Link>

      <nav className="d-none d-lg-flex" style={{ alignItems: "center", gap: 24, flexGrow: 1 }}>
        {navItems.map(({ to, label, icon: Icon, iconOnly }) => (
          <NavLink
            key={to}
            to={to}
            title={label}
            className="nav-link fw-bold d-flex align-items-center gap-2"
          >
            <Icon size={iconOnly ? 20 : 16} />
            {!iconOnly && label}
          </NavLink>
        ))}
        <NotificationBell />
        {user?.role === "admin" && (
          <NavLink to="/admin" title="Admin" className="nav-link fw-bold">
            <FaUserShield size={20} />
          </NavLink>
        )}
      </nav>

      <div style={{ display: "flex", alignItems: "center", gap: 14, marginLeft: "auto" }}>
        <div style={{ position: "relative" }}>
          <button
            type="button"
            className="btn btn-light btn-sm"
            onClick={() => setSearchOpen((v) => !v)}
            title="Search users"
          >
            <FaSearch />
          </button>

          {searchOpen && (
            <div
              style={{
                position: "absolute",
                top: 42,
                right: 0,
                width: 300,
                background: "#ffffff",
                boxShadow: "0 8px 24px rgba(15, 23, 42, 0.16)",
                padding: 12,
                border: "1px solid #d9e2ec",
                borderRadius: 3,
                zIndex: 999,
              }}
            >
              <input
                autoFocus
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search users..."
                className="form-control mb-2"
              />
              <div style={{ maxHeight: 250, overflowY: "auto" }}>
                {filtered.length === 0 && (
                  <div style={{ padding: 8, color: "#64748b" }}>No users found</div>
                )}
                {filtered.map((u) => (
                  <button
                    type="button"
                    key={u._id}
                    onClick={() => {
                      closeAndNavigate(`/profile/${u._id}`);
                      setQuery("");
                    }}
                    className="w-100 border-0 bg-white text-start d-flex align-items-center"
                    style={{ padding: "8px 6px", gap: 10 }}
                  >
                    <img
                      src={
                        u.profileImage ||
                        "https://static.vecteezy.com/system/resources/previews/018/742/015/original/minimal-profile-account-symbol-user-interface-theme-3d-icon-rendering-illustration-isolated-in-transparent-background-png.png"
                      }
                      alt=""
                      style={{ width: 34, height: 34, objectFit: "cover" }}
                    />
                    <span>
                      <span style={{ display: "block", fontWeight: 600 }}>
                        {u.name || u.username}
                      </span>
                      <span style={{ display: "block", fontSize: 12, color: "#64748b" }}>
                        @{u.username}
                      </span>
                    </span>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        {user ? (
          <>
            <img
              src={profileImage}
              alt="Profile"
              className="border"
              style={{ width: 48, height: 48, objectFit: "cover", cursor: "pointer" }}
              onClick={() => closeAndNavigate("/profile")}
            />
            <button
              type="button"
              onClick={() => {
                logout();
                setMenuOpen(false);
              }}
              className="btn btn-outline-danger btn-sm"
            >
              Logout
            </button>
          </>
        ) : (
          <>
            <Link to="/login" className="btn btn-primary btn-sm">
              Login
            </Link>
            <Link to="/signup" className="btn btn-outline-secondary btn-sm">
              Signup
            </Link>
          </>
        )}

        <button
          type="button"
          className="btn btn-light d-lg-none"
          onClick={() => setMenuOpen(true)}
          title="Open menu"
        >
          <FaBars />
        </button>
      </div>

      {menuOpen && (
        <>
          <div
            style={{
              position: "fixed",
              top: 0,
              right: 0,
              height: "100%",
              width: 260,
              background: "#ffffff",
              boxShadow: "-3px 0 14px rgba(15, 23, 42, 0.22)",
              padding: 20,
              zIndex: 1000,
            }}
          >
            <button
              type="button"
              onClick={() => setMenuOpen(false)}
              className="btn btn-light float-end"
              title="Close menu"
            >
              <FaTimes />
            </button>
            <div style={{ clear: "both", paddingTop: 18 }}>
              {navItems.map(({ to, label, icon: Icon }) => (
                <NavLink
                  key={to}
                  to={to}
                  onClick={() => setMenuOpen(false)}
                  className="nav-link d-flex align-items-center gap-2 py-2"
                >
                  <Icon /> {label}
                </NavLink>
              ))}
              <NavLink
                to="/notifications"
                onClick={() => setMenuOpen(false)}
                className="nav-link d-flex align-items-center gap-2 py-2"
              >
                <FaBell /> Notifications
              </NavLink>
              {user?.role === "admin" && (
                <NavLink
                  to="/admin"
                  onClick={() => setMenuOpen(false)}
                  className="nav-link d-flex align-items-center gap-2 py-2"
                >
                  <FaUserShield /> Admin
                </NavLink>
              )}
            </div>
          </div>

          <div
            onClick={() => setMenuOpen(false)}
            style={{
              position: "fixed",
              top: 0,
              left: 0,
              width: "100%",
              height: "100%",
              background: "rgba(15, 23, 42, 0.35)",
              zIndex: 900,
            }}
          />
        </>
      )}
    </header>
  );
}
