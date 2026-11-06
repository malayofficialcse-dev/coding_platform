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
  FaSun,
  FaMoon,
  FaChalkboardTeacher,
} from "react-icons/fa";
import api from "../api/api";
import { AuthContext } from "../contexts/AuthContext";
import NotificationBell from "./NotificationBell";
import ProfileIcon from "../assets/user-solid-full.svg";
import CodeCampus from "../assets/image1.jpeg";
import { useTheme } from "../contexts/ThemeContext";

export default function Header() {
  const { theme, toggleTheme } = useTheme();
  const { user, logout } = useContext(AuthContext);
  const [menuOpen, setMenuOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [users, setUsers] = useState([]);
  const navigate = useNavigate();

  // Role and Permission based Navigation Visibility
  const visibleNavItems = React.useMemo(() => {
    // 1. Guest / Unauthenticated users: public views
    if (!user) {
      return [
        { to: "/", label: "Home", icon: FaHome, iconOnly: true },
        { to: "/about", label: "About", icon: FaInfoCircle },
      ];
    }

    const role = user.role;

    // 2. Super Admin & Admin: unrestricted full access
    if (role === "super_admin" || role === "admin") {
      return [
        { to: "/", label: "Home", icon: FaHome, iconOnly: true },
        { to: "/courses", label: "Courses", icon: FaBookOpen },
        { to: "/exams", label: "Exams", icon: FaFlask },
        { to: "/coding", label: "Coding Problems", icon: FaCode },
        { to: "/about", label: "About", icon: FaInfoCircle },
        { to: "/messages", label: "Messages", icon: FaComments, iconOnly: true },
        { to: "/mentorship", label: "Mentor sessions", icon: FaChalkboardTeacher },
      ];
    }

    // 3. Students, Teachers & Standard Users: standard learner views
    if (role === "student" || role === "user" || role === "teacher") {
      return [
        { to: "/", label: "Home", icon: FaHome, iconOnly: true },
        { to: "/courses", label: "Courses", icon: FaBookOpen },
        { to: "/exams", label: "Exams", icon: FaFlask },
        { to: "/coding", label: "Coding Problems", icon: FaCode },
        { to: "/about", label: "About", icon: FaInfoCircle },
        { to: "/messages", label: "Messages", icon: FaComments, iconOnly: true },
        { to: "/mentorship", label: "Mentor sessions", icon: FaChalkboardTeacher },
      ];
    }

    if (role === "mentor") {
      return [
        { to: "/", label: "Home", icon: FaHome, iconOnly: true },
        { to: "/courses", label: "Courses", icon: FaBookOpen },
        { to: "/exams", label: "Exams", icon: FaFlask },
        { to: "/coding", label: "Coding Problems", icon: FaCode },
        { to: "/about", label: "About", icon: FaInfoCircle },
        { to: "/messages", label: "Messages", icon: FaComments, iconOnly: true },
        { to: "/mentorship", label: "Mentor sessions", icon: FaChalkboardTeacher },
      ];
    }

    // 4. Coordinators (course_coordinator, exam_coordinator, feed_coordinator):
    // Strict Role & Permission-based Access!
    // A coordinator only sees their assigned core module, normal dashboard, and profile.
    // They CANNOT see other module options on the header UNLESS explicit permission is granted!
    const items = [
      { to: "/", label: "Home", icon: FaHome, iconOnly: true },
      { to: "/mentorship", label: "Mentor sessions", icon: FaChalkboardTeacher },
    ];

    // Courses module: Visible for course_coordinator OR if courses.view is granted
    const canSeeCourses =
      role === "course_coordinator" ||
      user.permissions?.courses?.view === true ||
      user.permissions?.courses?.create === true;
    if (canSeeCourses) {
      items.push({ to: "/courses", label: "Courses", icon: FaBookOpen });
    }

    // Exams module: Visible for exam_coordinator OR if exams.view is explicitly granted
    const canSeeExams =
      role === "exam_coordinator" ||
      user.permissions?.exams?.view === true ||
      user.permissions?.exams?.create === true;
    if (canSeeExams) {
      items.push({ to: "/exams", label: "Exams", icon: FaFlask });
    }

    // Coding module: Visible ONLY if coding.view is explicitly granted
    const canSeeCoding =
      user.permissions?.coding?.view === true ||
      user.permissions?.coding?.create === true;
    if (canSeeCoding) {
      items.push({ to: "/coding", label: "Coding Problems", icon: FaCode });
    }

    // About page: General platform information
    items.push({ to: "/about", label: "About", icon: FaInfoCircle });

    // Messages: Visible for feed_coordinator OR if feed.view is granted
    const canSeeMessages =
      role === "feed_coordinator" ||
      user.permissions?.feed?.view === true ||
      user.permissions?.feed?.create === true;
    if (canSeeMessages) {
      items.push({ to: "/messages", label: "Messages", icon: FaComments, iconOnly: true });
    }

    return items;
  }, [user]);

  useEffect(() => {
    api
      .get("/users")
      .then((res) => {
        const list = Array.isArray(res.data) ? res.data : res.data?.users || [];
        setUsers(list);
      })
      .catch((err) => console.error("Error loading users for search:", err));
  }, []);

  // Close modals on Escape key
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === "Escape") {
        setSearchOpen(false);
        setMenuOpen(false);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  const q = query.trim().toLowerCase();
  const filtered = q
    ? users.filter((u) =>
        (u.name || "").toLowerCase().includes(q) ||
        (u.username || "").toLowerCase().includes(q) ||
        (u.email || "").toLowerCase().includes(q)
      )
    : users.slice(0, 8);

  const profileImage = user?.profileImage || ProfileIcon;

  const closeAndNavigate = (path) => {
    setMenuOpen(false);
    setSearchOpen(false);
    navigate(path);
  };

  return (
    <header
      className="cc-site-header"
      style={{
        width: "100%",
        minHeight: 68,
        background: "var(--cc-surface)",
        borderBottom: "1px solid var(--cc-border)",
        position: "sticky",
        top: 0,
        zIndex: 1000,
        display: "flex",
        alignItems: "center",
        padding: "0 18px",
        boxShadow: "0 2px 8px rgba(15, 23, 42, 0.08)",
      }}
    >
      <Link
        to="/"
        className="cc-header-brand"
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
        <span style={{ fontSize: 22, fontWeight: 700, color: "var(--cc-primary)" }}>
          Code Campus
        </span>
      </Link>

      <nav className="d-none d-lg-flex" style={{ alignItems: "center", gap: 24, flexGrow: 1 }}>
        {visibleNavItems.map(({ to, label, icon: Icon, iconOnly }) => (
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
        {["admin", "super_admin"].includes(user?.role) && (
          <NavLink to="/admin" title="Admin Panel" className="nav-link fw-bold">
            <FaUserShield size={20} />
          </NavLink>
        )}
        {user?.role === "super_admin" && (
          <NavLink to="/admin/rbac" title="RBAC Control" className="nav-link fw-bold" style={{ color: "#8b5cf6" }}>
            🔑
          </NavLink>
        )}
        {["exam_coordinator", "course_coordinator", "feed_coordinator"].includes(user?.role) && (
          <NavLink to="/coordinator" title="My Dashboard" className="nav-link fw-bold">
            <FaUserShield size={20} />
          </NavLink>
        )}
      </nav>

      <div className="cc-header-actions" style={{ display: "flex", alignItems: "center", gap: 14, marginLeft: "auto" }}>
        <button
          type="button"
          className="btn btn-sm d-flex align-items-center justify-content-center cc-header-theme"
          onClick={toggleTheme}
          title={theme === "light" ? "Switch to dark mode" : "Switch to light mode"}
          style={{
            background: "var(--cc-surface-muted)",
            color: "var(--cc-text)",
            border: "1px solid var(--cc-border)",
            width: 32,
            height: 32,
            padding: 0,
          }}
        >
          {theme === "light" ? <FaMoon size={16} /> : <FaSun size={16} />}
        </button>

        <div className="cc-header-search">
          <button
            type="button"
            className="btn btn-light btn-sm"
            onClick={() => setSearchOpen(true)}
            title="Search users"
            style={{ background: "var(--cc-surface-muted)", color: "var(--cc-text)", border: "1px solid var(--cc-border)" }}
          >
            <FaSearch />
          </button>
        </div>

        {user ? (
          <>
            <img
              src={profileImage}
              alt="Profile"
              className="border cc-header-avatar"
              style={{ width: 48, height: 48, objectFit: "cover", cursor: "pointer" }}
              onClick={() => closeAndNavigate("/profile")}
            />
            <button
              type="button"
              onClick={() => {
                logout();
                setMenuOpen(false);
              }}
              className="btn btn-outline-danger btn-sm cc-header-logout"
            >
              Logout
            </button>
          </>
        ) : (
          <>
            <Link to="/login" className="btn btn-primary btn-sm cc-header-login">
              Login
            </Link>
            <Link to="/signup" className="btn btn-outline-secondary btn-sm cc-header-signup">
              Signup
            </Link>
          </>
        )}

        <button
          type="button"
          className="btn btn-light d-lg-none cc-header-menu-toggle"
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
              background: "var(--cc-surface)",
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
              {user && (
                <NavLink
                  to="/profile"
                  onClick={() => setMenuOpen(false)}
                  className="nav-link d-flex align-items-center gap-2 py-2"
                >
                  <img src={profileImage} alt="" className="cc-mobile-menu-avatar" />
                  My Profile
                </NavLink>
              )}
              {!user && (
                <>
                  <NavLink to="/login" onClick={() => setMenuOpen(false)} className="nav-link d-flex align-items-center gap-2 py-2">
                    Login
                  </NavLink>
                  <NavLink to="/signup" onClick={() => setMenuOpen(false)} className="nav-link d-flex align-items-center gap-2 py-2">
                    Signup
                  </NavLink>
                </>
              )}
              <button
                type="button"
                onClick={() => {
                  setMenuOpen(false);
                  setSearchOpen(true);
                }}
                className="nav-link d-flex align-items-center gap-2 py-2 w-100 border-0 bg-transparent text-start"
              >
                <FaSearch /> Search users
              </button>
              <button
                type="button"
                onClick={toggleTheme}
                className="nav-link d-flex align-items-center gap-2 py-2 w-100 border-0 bg-transparent text-start"
              >
                {theme === "light" ? <FaMoon /> : <FaSun />}
                {theme === "light" ? "Dark mode" : "Light mode"}
              </button>
              {visibleNavItems.map(({ to, label, icon: Icon }) => (
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
              {["admin", "super_admin"].includes(user?.role) && (
                <NavLink
                  to="/admin"
                  onClick={() => setMenuOpen(false)}
                  className="nav-link d-flex align-items-center gap-2 py-2"
                >
                  <FaUserShield /> Admin Panel
                </NavLink>
              )}
              {user?.role === "super_admin" && (
                <NavLink
                  to="/admin/rbac"
                  onClick={() => setMenuOpen(false)}
                  className="nav-link d-flex align-items-center gap-2 py-2"
                  style={{ color: "#8b5cf6" }}
                >
                  🔑 RBAC Control
                </NavLink>
              )}
              {["exam_coordinator", "course_coordinator", "feed_coordinator"].includes(user?.role) && (
                <NavLink
                  to="/coordinator"
                  onClick={() => setMenuOpen(false)}
                  className="nav-link d-flex align-items-center gap-2 py-2"
                >
                  <FaUserShield /> My Dashboard
                </NavLink>
              )}
              {user && (
                <button
                  type="button"
                  onClick={() => {
                    logout();
                    setMenuOpen(false);
                  }}
                  className="nav-link d-flex align-items-center gap-2 py-2 w-100 border-0 bg-transparent text-start text-danger"
                >
                  Logout
                </button>
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

      {/* ── Responsive Search Modal (Visible on both mobile & desktop) ── */}
      {searchOpen && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            backgroundColor: "rgba(15, 23, 42, 0.65)",
            backdropFilter: "blur(4px)",
            WebkitBackdropFilter: "blur(4px)",
            zIndex: 2000,
            display: "flex",
            alignItems: "flex-start",
            justifyContent: "center",
            padding: "16px",
            paddingTop: "max(60px, 8vh)",
          }}
          onClick={() => {
            setSearchOpen(false);
            setQuery("");
          }}
        >
          <div
            style={{
              width: "100%",
              maxWidth: 480,
              background: "var(--cc-surface, #ffffff)",
              border: "1px solid var(--cc-border, #d6dbe1)",
              borderRadius: 12,
              boxShadow: "0 20px 40px rgba(0, 0, 0, 0.35)",
              overflow: "hidden",
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Search Input Bar */}
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 12,
                padding: "12px 16px",
                borderBottom: "1px solid var(--cc-border, #d6dbe1)",
                background: "var(--cc-surface-muted, #f8fafc)",
              }}
            >
              <FaSearch style={{ color: "var(--cc-primary, #0078d4)", flexShrink: 0 }} size={16} />
              <input
                autoFocus
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search Code Campus users…"
                style={{
                  flex: 1,
                  border: "none",
                  outline: "none",
                  background: "transparent",
                  color: "var(--cc-text, inherit)",
                  fontSize: "0.95rem",
                }}
              />
              {query && (
                <button
                  type="button"
                  onClick={() => setQuery("")}
                  className="border-0 bg-transparent p-1"
                  style={{ color: "var(--cc-muted, #94a3b8)", cursor: "pointer" }}
                  title="Clear search"
                >
                  <FaTimes size={13} />
                </button>
              )}
              <button
                type="button"
                onClick={() => {
                  setSearchOpen(false);
                  setQuery("");
                }}
                className="btn btn-sm btn-light border"
                style={{
                  fontSize: "0.78rem",
                  padding: "4px 10px",
                  borderRadius: 6,
                  color: "var(--cc-text, inherit)",
                  background: "var(--cc-surface, #ffffff)",
                }}
              >
                Cancel
              </button>
            </div>

            {/* Subheading */}
            <div
              style={{
                padding: "8px 16px 4px",
                fontSize: "0.72rem",
                fontWeight: 700,
                textTransform: "uppercase",
                letterSpacing: "0.06em",
                color: "var(--cc-muted, #94a3b8)",
              }}
            >
              {q ? "Search Results" : "Suggested Members"}
            </div>

            {/* Results List */}
            <div style={{ maxHeight: "60vh", overflowY: "auto", padding: "4px 0 8px" }}>
              {filtered.length === 0 ? (
                <div
                  style={{
                    padding: "32px 16px",
                    textAlign: "center",
                    color: "var(--cc-muted, #94a3b8)",
                    fontSize: "0.88rem",
                  }}
                >
                  No users found matching "{query}"
                </div>
              ) : (
                filtered.map((u) => {
                  const uId = u._id || u.id;
                  const uImage = u.profileImage || ProfileIcon;
                  return (
                    <button
                      type="button"
                      key={uId}
                      onClick={() => {
                        closeAndNavigate(`/profile/${uId}`);
                        setQuery("");
                      }}
                      className="w-100 border-0 text-start d-flex align-items-center gap-3 px-3 py-2"
                      style={{
                        background: "transparent",
                        color: "var(--cc-text, inherit)",
                        cursor: "pointer",
                        transition: "background 0.15s ease",
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.backgroundColor =
                          "var(--cc-surface-muted, rgba(0,0,0,0.05))";
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.backgroundColor = "transparent";
                      }}
                    >
                      <img
                        src={uImage}
                        alt={u.name || u.username}
                        style={{
                          width: 38,
                          height: 38,
                          borderRadius: "50%",
                          objectFit: "cover",
                          border: "1.5px solid var(--cc-border, #d6dbe1)",
                          flexShrink: 0,
                        }}
                        onError={(e) => {
                          e.currentTarget.onerror = null;
                          e.currentTarget.src = ProfileIcon;
                        }}
                      />
                      <div style={{ minWidth: 0, flex: 1 }}>
                        <div
                          style={{
                            fontWeight: 600,
                            fontSize: "0.9rem",
                            color: "var(--cc-text, inherit)",
                            overflow: "hidden",
                            textOverflow: "ellipsis",
                            whiteSpace: "nowrap",
                          }}
                        >
                          {u.name || u.username}
                        </div>
                        <div
                          style={{
                            fontSize: "0.78rem",
                            color: "var(--cc-muted, #94a3b8)",
                            overflow: "hidden",
                            textOverflow: "ellipsis",
                            whiteSpace: "nowrap",
                          }}
                        >
                          @{u.username || "user"}
                          {u.role ? ` · ${u.role}` : ""}
                        </div>
                      </div>
                    </button>
                  );
                })
              )}
            </div>
          </div>
        </div>
      )}
    </header>
  );
}
