import React, { useContext, useEffect, useState, useCallback } from "react";
import api from "../../api/api";
import { AuthContext } from "../../contexts/AuthContext";
import { exportToExcel } from "../../utils/excelExport";
import { FaFileExcel, FaTrashAlt, FaKey, FaEdit, FaBan, FaCheck, FaTimes } from "react-icons/fa";
import "./SuperAdmin.css";

const ROLES = [
  { value: "student",            label: "Student",            color: "#3b82f6" },
  { value: "exam_coordinator",   label: "Exam Coordinator",   color: "#8b5cf6" },
  { value: "course_coordinator", label: "Course Coordinator", color: "#059669" },
  { value: "feed_coordinator",   label: "Feed Coordinator",   color: "#d97706" },
  { value: "teacher",            label: "Teacher",            color: "#0891b2" },
  { value: "admin",              label: "Admin",              color: "#dc2626" },
  { value: "user",               label: "User",               color: "#6b7280" },
];

const MODULES = [
  { key: "exams",     label: "Exams",     icon: "📋" },
  { key: "courses",   label: "Courses",   icon: "📚" },
  { key: "feed",      label: "Feed",      icon: "📰" },
  { key: "coding",    label: "Coding",    icon: "💻" },
  { key: "users",     label: "Users",     icon: "👥" },
  { key: "analytics", label: "Analytics", icon: "📊" },
];

const ACTIONS = ["view", "create", "edit", "delete"];

const ROLE_BADGE_COLORS = {
  student:            "#3b82f6",
  exam_coordinator:   "#8b5cf6",
  course_coordinator: "#059669",
  feed_coordinator:   "#d97706",
  admin:              "#dc2626",
  super_admin:        "#1e293b",
  teacher:            "#0891b2",
  user:               "#6b7280",
};

const DEFAULT_PERMS = {
  admin: {
    exams:     { create:true, edit:true, delete:true, view:true },
    courses:   { create:true, edit:true, delete:true, view:true },
    feed:      { create:true, edit:true, delete:true, view:true },
    coding:    { create:true, edit:true, delete:true, view:true },
    users:     { create:true, edit:true, delete:true, view:true },
    analytics: { create:true, edit:true, delete:true, view:true },
  },
  exam_coordinator: {
    exams:     { create:true, edit:true, delete:true, view:true },
    courses:   { create:false, edit:false, delete:false, view:false },
    feed:      { create:false, edit:false, delete:false, view:false },
    coding:    { create:false, edit:false, delete:false, view:false },
    users:     { create:false, edit:false, delete:false, view:false },
    analytics: { create:false, edit:false, delete:false, view:false },
  },
  course_coordinator: {
    exams:     { create:false, edit:false, delete:false, view:false },
    courses:   { create:true, edit:true, delete:true, view:true },
    feed:      { create:false, edit:false, delete:false, view:false },
    coding:    { create:false, edit:false, delete:false, view:false },
    users:     { create:false, edit:false, delete:false, view:false },
    analytics: { create:false, edit:false, delete:false, view:false },
  },
  feed_coordinator: {
    exams:     { create:false, edit:false, delete:false, view:false },
    courses:   { create:false, edit:false, delete:false, view:false },
    feed:      { create:true, edit:true, delete:true, view:true },
    coding:    { create:false, edit:false, delete:false, view:false },
    users:     { create:false, edit:false, delete:false, view:false },
    analytics: { create:false, edit:false, delete:false, view:false },
  },
  teacher: {
    exams:     { create:true, edit:true, delete:false, view:true },
    courses:   { create:true, edit:true, delete:false, view:true },
    feed:      { create:true, edit:false, delete:false, view:true },
    coding:    { create:true, edit:true, delete:false, view:true },
    users:     { create:false, edit:false, delete:false, view:true },
    analytics: { create:false, edit:false, delete:false, view:true },
  },
  student: {
    exams:     { create:false, edit:false, delete:false, view:true },
    courses:   { create:false, edit:false, delete:false, view:true },
    feed:      { create:true, edit:false, delete:false, view:true },
    coding:    { create:false, edit:false, delete:false, view:true },
    users:     { create:false, edit:false, delete:false, view:true },
    analytics: { create:false, edit:false, delete:false, view:false },
  },
  user: {
    exams:     { create:false, edit:false, delete:false, view:true },
    courses:   { create:false, edit:false, delete:false, view:true },
    feed:      { create:true, edit:false, delete:false, view: true },
    coding:    { create:false, edit:false, delete:false, view:true },
    users:     { create:false, edit:false, delete:false, view:true },
    analytics: { create:false, edit:false, delete:false, view:false },
  },
};

function emptyPerms() {
  return Object.fromEntries(MODULES.map(m => [m.key, { view:false, create:false, edit:false, delete:false }]));
}

function fullPerms() {
  return Object.fromEntries(MODULES.map(m => [m.key, { view:true, create:true, edit:true, delete:true }]));
}

function roleBadge(role) {
  const meta = ROLES.find(r => r.value === role);
  return (
    <span
      className="sa-role-badge"
      style={{
        background: ROLE_BADGE_COLORS[role] || "#6b7280",
        color: "#fff",
      }}
    >
      {meta?.label || role}
    </span>
  );
}

// ─── Stats Cards ────────────────────────────────────────────────────────────
function StatsBar({ stats }) {
  if (!stats) return null;
  const items = [
    { label: "Total Users", value: stats.total,    icon: "👥", color: "#3b82f6" },
    { label: "Active",      value: stats.active,   icon: "✅", color: "#059669" },
    { label: "Inactive",    value: stats.inactive, icon: "🔴", color: "#dc2626" },
  ];
  const roleCounts = stats.roleCounts || [];
  return (
    <div className="sa-stats-bar">
      {items.map(i => (
        <div key={i.label} className="sa-stat-card" style={{ borderTopColor: i.color }}>
          <span className="sa-stat-icon">{i.icon}</span>
          <span className="sa-stat-value">{i.value ?? "—"}</span>
          <span className="sa-stat-label">{i.label}</span>
        </div>
      ))}
      {roleCounts.map(rc => {
        const roleInfo = ROLES.find(r => r.value === rc._id);
        const label = roleInfo?.label || rc._id;
        const color = roleInfo?.color || ROLE_BADGE_COLORS[rc._id] || "#6b7280";
        return (
          <div key={rc._id} className="sa-stat-card" style={{ borderTopColor: color }}>
            <span className="sa-stat-icon">🔑</span>
            <span className="sa-stat-value">{rc.count}</span>
            <span className="sa-stat-label">{label}</span>
          </div>
        );
      })}
    </div>
  );
}

// ─── Permission Grid ─────────────────────────────────────────────────────────
function PermissionGrid({ permissions, onChange, readOnly = false }) {
  const perms = permissions || emptyPerms();

  const handleRowToggle = (moduleKey) => {
    if (readOnly || !onChange) return;
    const current = perms[moduleKey] || {};
    const allChecked = ACTIONS.every(a => !!current[a]);
    const nextVal = !allChecked;
    const updated = {
      ...perms,
      [moduleKey]: {
        view: nextVal,
        create: nextVal,
        edit: nextVal,
        delete: nextVal,
      },
    };
    onChange(updated);
  };

  const handleColToggle = (action) => {
    if (readOnly || !onChange) return;
    const allChecked = MODULES.every(m => !!perms[m.key]?.[action]);
    const nextVal = !allChecked;
    const updated = { ...perms };
    MODULES.forEach(m => {
      updated[m.key] = { ...(updated[m.key] || {}), [action]: nextVal };
    });
    onChange(updated);
  };

  return (
    <div className="sa-perm-grid-wrap">
      <table className="sa-perm-grid">
        <thead>
          <tr>
            <th>Module</th>
            {ACTIONS.map(a => (
              <th
                key={a}
                style={{ cursor: readOnly ? "default" : "pointer" }}
                title={readOnly ? undefined : `Click to toggle all ${a} permissions`}
                onClick={() => !readOnly && handleColToggle(a)}
              >
                {a.charAt(0).toUpperCase() + a.slice(1)}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {MODULES.map(mod => (
            <tr key={mod.key}>
              <td className="sa-perm-module">
                <button
                  type="button"
                  className="sa-module-toggle-btn"
                  disabled={readOnly}
                  onClick={() => handleRowToggle(mod.key)}
                  title={readOnly ? undefined : "Click to toggle all permissions for this module"}
                  style={{
                    background: "none",
                    border: "none",
                    cursor: readOnly ? "default" : "pointer",
                    display: "flex",
                    alignItems: "center",
                    gap: "6px",
                    fontWeight: 600,
                    color: "inherit",
                    padding: 0,
                  }}
                >
                  <span>{mod.icon}</span>
                  <span>{mod.label}</span>
                </button>
              </td>
              {ACTIONS.map(action => (
                <td key={action} className="sa-perm-cell">
                  <label className="sa-toggle">
                    <input
                      type="checkbox"
                      checked={!!(perms[mod.key]?.[action])}
                      disabled={readOnly}
                      onChange={e => {
                        if (readOnly || !onChange) return;
                        const updated = {
                          ...perms,
                          [mod.key]: { ...(perms[mod.key] || {}), [action]: e.target.checked },
                        };
                        onChange(updated);
                      }}
                    />
                    <span className="sa-toggle-slider" />
                  </label>
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

// ─── Create / Edit User Modal ────────────────────────────────────────────────
function UserModal({ editUser, onClose, onSave }) {
  const isEdit = !!editUser;
  const [form, setForm] = useState({
    name:          editUser?.name          || "",
    email:         editUser?.email         || "",
    password:      "",
    role:          editUser?.role          || "student",
    college:       editUser?.college       || "",
    degree:        editUser?.degree        || "",
    yearOfPassing: editUser?.yearOfPassing || "",
  });
  const [permissions, setPermissions] = useState(
    editUser?.permissions || DEFAULT_PERMS[editUser?.role || "student"] || emptyPerms()
  );
  const [saving, setSaving] = useState(false);
  const [error,  setError]  = useState("");

  const handleRoleChange = (role) => {
    setForm(f => ({ ...f, role }));
    setPermissions(DEFAULT_PERMS[role] || emptyPerms());
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError("");
    try {
      const payload = { ...form, permissions };
      if (isEdit) {
        if (!payload.password) delete payload.password;
        await api.put(`/admin/rbac/users/${editUser._id}`, payload);
      } else {
        if (!payload.password) { setError("Password is required."); setSaving(false); return; }
        await api.post("/admin/rbac/users", payload);
      }
      onSave();
    } catch (err) {
      setError(err.response?.data?.message || err.response?.data?.error || err.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="sa-modal-overlay" onClick={onClose}>
      <div className="sa-modal" onClick={e => e.stopPropagation()}>
        <div className="sa-modal-header">
          <h2>{isEdit ? "Edit User" : "Create New User"}</h2>
          <button className="sa-modal-close" onClick={onClose}>×</button>
        </div>
        <form className="sa-modal-body" onSubmit={handleSubmit}>
          {error && <div className="sa-alert sa-alert-error">{error}</div>}
          <div className="sa-form-row">
            <div className="sa-form-group">
              <label>Full Name *</label>
              <input className="sa-input" value={form.name} onChange={e => setForm(f => ({...f, name: e.target.value}))} required />
            </div>
            <div className="sa-form-group">
              <label>Email *</label>
              <input className="sa-input" type="email" value={form.email} onChange={e => setForm(f => ({...f, email: e.target.value}))} required disabled={isEdit} />
            </div>
          </div>
          <div className="sa-form-group">
            <label>{isEdit ? "New Password (leave blank to keep current)" : "Password *"}</label>
            <input className="sa-input" type="password" value={form.password} onChange={e => setForm(f => ({...f, password: e.target.value}))} required={!isEdit} />
          </div>
          <div className="sa-form-group">
            <label>Assigned Role *</label>
            <div className="sa-role-selector">
              {ROLES.map(r => (
                <button
                  key={r.value}
                  type="button"
                  className={`sa-role-btn${form.role === r.value ? " active" : ""}`}
                  style={{ "--role-color": r.color }}
                  onClick={() => handleRoleChange(r.value)}
                >
                  {r.label}
                </button>
              ))}
            </div>
          </div>
          <div className="sa-form-row">
            <div className="sa-form-group">
              <label>College</label>
              <input className="sa-input" value={form.college} onChange={e => setForm(f => ({...f, college: e.target.value}))} />
            </div>
            <div className="sa-form-group">
              <label>Degree</label>
              <input className="sa-input" value={form.degree} onChange={e => setForm(f => ({...f, degree: e.target.value}))} />
            </div>
            <div className="sa-form-group">
              <label>Year of Passing</label>
              <input className="sa-input" value={form.yearOfPassing} onChange={e => setForm(f => ({...f, yearOfPassing: e.target.value}))} />
            </div>
          </div>

          <div className="sa-perm-section">
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "6px" }}>
              <h3 className="sa-perm-title">Module Permissions</h3>
              <div style={{ display: "flex", gap: "6px" }}>
                <button
                  type="button"
                  className="sa-btn sa-btn-ghost"
                  style={{ height: "28px", padding: "0 10px", fontSize: "0.75rem" }}
                  onClick={() => setPermissions(fullPerms())}
                >
                  Grant All
                </button>
                <button
                  type="button"
                  className="sa-btn sa-btn-ghost"
                  style={{ height: "28px", padding: "0 10px", fontSize: "0.75rem" }}
                  onClick={() => setPermissions(emptyPerms())}
                >
                  Revoke All
                </button>
                <button
                  type="button"
                  className="sa-btn sa-btn-ghost"
                  style={{ height: "28px", padding: "0 10px", fontSize: "0.75rem" }}
                  onClick={() => setPermissions(DEFAULT_PERMS[form.role] || emptyPerms())}
                >
                  Reset to Role Defaults
                </button>
              </div>
            </div>
            <p className="sa-perm-hint">Fine-tune individual module actions or click headers to batch-toggle.</p>
            <PermissionGrid permissions={permissions} onChange={setPermissions} />
          </div>

          <div className="sa-modal-footer">
            <button type="button" className="sa-btn sa-btn-ghost" onClick={onClose}>Cancel</button>
            <button type="submit" className="sa-btn sa-btn-primary" disabled={saving}>
              {saving ? "Saving…" : isEdit ? "Save Changes" : "Create User"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ─── Interactive Dedicated Permission Manager Modal ─────────────────────────
function PermEditModal({ user, onClose, onSave }) {
  const [permissions, setPermissions] = useState(user.permissions || DEFAULT_PERMS[user.role] || emptyPerms());
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const applyPreset = (presetRole) => {
    if (DEFAULT_PERMS[presetRole]) {
      setPermissions(DEFAULT_PERMS[presetRole]);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    setError("");
    try {
      await api.patch(`/admin/rbac/users/${user._id}/permissions`, { permissions });
      onSave();
    } catch (err) {
      setError(err.response?.data?.message || err.response?.data?.error || err.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="sa-modal-overlay" onClick={onClose}>
      <div className="sa-modal sa-modal-md" onClick={e => e.stopPropagation()}>
        <div className="sa-modal-header">
          <div>
            <h2>Manage Permissions — {user.name}</h2>
            <div style={{ display: "flex", alignItems: "center", gap: "8px", marginTop: "4px" }}>
              <span style={{ fontSize: "0.8rem", color: "var(--cc-muted)" }}>{user.email}</span>
              {roleBadge(user.role)}
            </div>
          </div>
          <button className="sa-modal-close" onClick={onClose}>×</button>
        </div>

        <div className="sa-modal-body">
          {error && <div className="sa-alert sa-alert-error">{error}</div>}

          {/* Preset Buttons */}
          <div style={{ display: "flex", flexWrap: "wrap", alignItems: "center", gap: "6px", marginBottom: "4px" }}>
            <span style={{ fontSize: "0.75rem", fontWeight: 700, textTransform: "uppercase", color: "var(--cc-muted)" }}>
              Presets:
            </span>
            <button type="button" className="sa-btn sa-btn-ghost sa-btn-xs" onClick={() => applyPreset("student")}>Student</button>
            <button type="button" className="sa-btn sa-btn-ghost sa-btn-xs" onClick={() => applyPreset("exam_coordinator")}>Exam Coord</button>
            <button type="button" className="sa-btn sa-btn-ghost sa-btn-xs" onClick={() => applyPreset("course_coordinator")}>Course Coord</button>
            <button type="button" className="sa-btn sa-btn-ghost sa-btn-xs" onClick={() => applyPreset("feed_coordinator")}>Feed Coord</button>
            <button type="button" className="sa-btn sa-btn-ghost sa-btn-xs" onClick={() => applyPreset("admin")}>Full Admin</button>
            <button type="button" className="sa-btn sa-btn-ghost sa-btn-xs" onClick={() => setPermissions(fullPerms())}>Grant All</button>
            <button type="button" className="sa-btn sa-btn-ghost sa-btn-xs" onClick={() => setPermissions(emptyPerms())}>Revoke All</button>
          </div>

          <PermissionGrid permissions={permissions} onChange={setPermissions} />
        </div>

        <div className="sa-modal-footer">
          <button type="button" className="sa-btn sa-btn-ghost" onClick={onClose}>Cancel</button>
          <button type="button" className="sa-btn sa-btn-primary" onClick={handleSave} disabled={saving}>
            {saving ? "Saving…" : "Save Permissions"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── User Table Row ───────────────────────────────────────────────────────────
function UserRow({ u, onEdit, onToggleActive, onViewPerms, onDelete }) {
  return (
    <tr className={!u.isActive ? "sa-row-inactive" : ""}>
      <td>
        <div className="sa-user-cell">
          <div className="sa-avatar">{(u.name || u.email || "?")[0].toUpperCase()}</div>
          <div>
            <div className="sa-user-name">{u.name}</div>
            <div className="sa-user-email">{u.email}</div>
          </div>
        </div>
      </td>
      <td>{roleBadge(u.role)}</td>
      <td>
        <span className={`sa-status-badge ${u.isActive !== false ? "active" : "inactive"}`}>
          {u.isActive !== false ? "Active" : "Inactive"}
        </span>
      </td>
      <td className="sa-actions-cell">
        <button className="sa-icon-btn sa-icon-btn-blue" title="Edit User" onClick={() => onEdit(u)}>
          <FaEdit />
        </button>
        <button className="sa-icon-btn sa-icon-btn-purple" title="Manage Permissions" onClick={() => onViewPerms(u)}>
          <FaKey />
        </button>
        <button
          className={`sa-icon-btn ${u.isActive !== false ? "sa-icon-btn-red" : "sa-icon-btn-green"}`}
          title={u.isActive !== false ? "Deactivate User" : "Activate User"}
          onClick={() => onToggleActive(u)}
        >
          {u.isActive !== false ? <FaBan /> : <FaCheck />}
        </button>
        <button className="sa-icon-btn sa-icon-btn-red" title="Delete User Permanently" onClick={() => onDelete(u)}>
          <FaTrashAlt />
        </button>
      </td>
    </tr>
  );
}

// ─── Main Component ──────────────────────────────────────────────────────────
export default function SuperAdminPanel() {
  const { user: me } = useContext(AuthContext);
  const [users,   setUsers]   = useState([]);
  const [stats,   setStats]   = useState(null);
  const [loading, setLoading] = useState(true);
  const [search,  setSearch]  = useState("");
  const [roleFilter, setRoleFilter] = useState("");
  const [page,    setPage]    = useState(1);
  const [pages,   setPages]   = useState(1);
  const [total,   setTotal]   = useState(0);
  const [modal,   setModal]   = useState(null); // null | { type: "create"|"edit"|"perm", user? }
  const [toast,   setToast]   = useState(null);
  const [exporting, setExporting] = useState(false);

  const showToast = (msg, type = "success") => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3500);
  };

  const fetchStats = useCallback(async () => {
    try {
      const res = await api.get("/admin/rbac/stats");
      setStats(res.data);
    } catch (e) { /* ignore */ }
  }, []);

  const fetchUsers = useCallback(async () => {
    setLoading(true);
    try {
      const params = { page, limit: 15, search, role: roleFilter };
      const res = await api.get("/admin/rbac/users", { params });
      setUsers(res.data.users || []);
      setPages(res.data.pages || 1);
      setTotal(res.data.total || 0);
    } catch (e) {
      showToast("Failed to load users.", "error");
    } finally {
      setLoading(false);
    }
  }, [page, search, roleFilter]);

  useEffect(() => { fetchStats(); }, [fetchStats]);
  useEffect(() => { fetchUsers(); }, [fetchUsers]);

  const handleExport = async () => {
    setExporting(true);
    try {
      const exportUsers = [];
      let exportPage = 1;
      let exportPages = 1;

      do {
        const res = await api.get("/admin/rbac/users", {
          params: { page: exportPage, limit: 100, search, role: roleFilter },
        });
        if (!Array.isArray(res.data?.users) || typeof res.data.pages !== "number") {
          throw new Error("The user export response was invalid.");
        }
        exportUsers.push(...res.data.users);
        exportPages = res.data.pages;
        exportPage += 1;
      } while (exportPage <= exportPages);

      const usersSheetData = exportUsers.map((u, idx) => {
        const row = {
          "S.No": idx + 1,
          "Name": u.name || "N/A",
          "Email": u.email || "N/A",
          "Role": ROLES.find((role) => role.value === u.role)?.label || u.role,
          "Status": u.isActive !== false ? "Active" : "Inactive",
          "College": u.college || "N/A",
          "Degree": u.degree || "N/A",
          "Year of Passing": u.yearOfPassing || "N/A",
        };

        MODULES.forEach((module) => {
          ACTIONS.forEach((action) => {
            const header = `${module.label} (${action.toUpperCase()})`;
            row[header] = u.permissions?.[module.key]?.[action] ? "Yes" : "No";
          });
        });

        row["User ID"] = u._id;
        return row;
      });

      const statsSheetData = [
        { "Metric / Role": "Total Users", "Count": stats?.total ?? exportUsers.length },
        { "Metric / Role": "Active Users", "Count": stats?.active ?? "N/A" },
        { "Metric / Role": "Inactive Users", "Count": stats?.inactive ?? "N/A" },
        ...((stats?.roleCounts || []).map((rc) => ({
          "Metric / Role": ROLES.find((r) => r.value === rc._id)?.label || rc._id,
          "Count": rc.count,
        }))),
      ];

      exportToExcel({
        filename: "RBAC_Users_Access_Control",
        sheets: [
          { sheetName: "Users & Permissions", data: usersSheetData },
          { sheetName: "Role Statistics", data: statsSheetData },
        ],
      });

      showToast(`Exported ${exportUsers.length} user${exportUsers.length === 1 ? "" : "s"} to Excel!`);
    } catch (error) {
      showToast(error.response?.data?.error || error.message || "Failed to export users.", "error");
    } finally {
      setExporting(false);
    }
  };

  const handleSave = () => {
    setModal(null);
    fetchUsers();
    fetchStats();
    showToast("User updated successfully!");
  };

  const handleToggleActive = async (u) => {
    try {
      if (u.isActive !== false) {
        await api.delete(`/admin/rbac/users/${u._id}`);
        showToast(`${u.name} deactivated.`);
      } else {
        await api.put(`/admin/rbac/users/${u._id}`, { isActive: true });
        showToast(`${u.name} activated.`);
      }
      fetchUsers();
      fetchStats();
    } catch (e) {
      showToast(e.response?.data?.error || "Action failed.", "error");
    }
  };

  const handleDeletePermanent = async (u) => {
    const confirmed = window.confirm(`Are you sure you want to PERMANENTLY delete user "${u.name}" (${u.email})? This action cannot be undone.`);
    if (!confirmed) return;

    try {
      await api.delete(`/admin/rbac/users/${u._id}/permanent`);
      showToast(`${u.name} permanently deleted.`);
      fetchUsers();
      fetchStats();
    } catch (e) {
      showToast(e.response?.data?.error || "Failed to delete user.", "error");
    }
  };

  return (
    <div className="sa-panel">
      {/* Toast */}
      {toast && (
        <div className={`sa-toast sa-toast-${toast.type}`}>{toast.msg}</div>
      )}

      {/* Header */}
      <div className="sa-header">
        <div>
          <div className="sa-header-label">Super Admin</div>
          <h1 className="sa-header-title">User &amp; Access Control</h1>
          <p className="sa-header-sub">Manage users, roles and module permissions across Code Campus</p>
        </div>
        <div className="sa-header-actions">
          <button
            className="sa-btn sa-btn-ghost sa-btn-lg"
            onClick={handleExport}
            disabled={exporting}
            style={{ display: "inline-flex", alignItems: "center", gap: "8px" }}
          >
            <FaFileExcel style={{ color: "#107c41" }} />
            {exporting ? "Exporting…" : "Export to Excel"}
          </button>
          <button className="sa-btn sa-btn-primary sa-btn-lg" onClick={() => setModal({ type: "create" })}>
            + Create User
          </button>
        </div>
      </div>

      {/* Stats */}
      <StatsBar stats={stats} />

      {/* Filters */}
      <div className="sa-filters">
        <input
          className="sa-input sa-search-input"
          placeholder="🔍  Search by name, email…"
          value={search}
          onChange={e => { setSearch(e.target.value); setPage(1); }}
        />
        <select
          className="sa-input sa-select"
          value={roleFilter}
          onChange={e => { setRoleFilter(e.target.value); setPage(1); }}
        >
          <option value="">All Roles</option>
          {ROLES.map(r => <option key={r.value} value={r.value}>{r.label}</option>)}
        </select>
        <span className="sa-total-label">{total} user{total !== 1 ? "s" : ""}</span>
      </div>

      {/* Table */}
      <div className="sa-table-wrap">
        <table className="sa-table">
          <thead>
            <tr>
              <th>User</th>
              <th>Role</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={4} className="sa-loading-row">Loading users…</td></tr>
            ) : users.length === 0 ? (
              <tr><td colSpan={4} className="sa-empty-row">No users found.</td></tr>
            ) : (
              users.map(u => (
                <UserRow
                  key={u._id}
                  u={u}
                  onEdit={user => setModal({ type: "edit", user })}
                  onToggleActive={handleToggleActive}
                  onViewPerms={user => setModal({ type: "perm", user })}
                  onDelete={handleDeletePermanent}
                />
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {pages > 1 && (
        <div className="sa-pagination">
          {Array.from({ length: pages }, (_, i) => i + 1).map(p => (
            <button
              key={p}
              className={`sa-page-btn${p === page ? " active" : ""}`}
              onClick={() => setPage(p)}
            >
              {p}
            </button>
          ))}
        </div>
      )}

      {/* Modals */}
      {modal?.type === "create" && (
        <UserModal onClose={() => setModal(null)} onSave={handleSave} />
      )}
      {modal?.type === "edit" && (
        <UserModal editUser={modal.user} onClose={() => setModal(null)} onSave={handleSave} />
      )}
      {modal?.type === "perm" && (
        <PermEditModal user={modal.user} onClose={() => setModal(null)} onSave={handleSave} />
      )}
    </div>
  );
}
