import React, { useContext, useEffect, useState, useCallback } from "react";
import api from "../../api/api";
import { AuthContext } from "../../contexts/AuthContext";
import "./SuperAdmin.css";

const ROLES = [
  { value: "student",          label: "Student",           color: "#3b82f6" },
  { value: "exam_coordinator", label: "Exam Coordinator",  color: "#8b5cf6" },
  { value: "course_coordinator", label: "Course Coordinator", color: "#059669" },
  { value: "feed_coordinator", label: "Feed Coordinator",  color: "#d97706" },
  { value: "admin",            label: "Admin",             color: "#dc2626" },
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
  student:           "#3b82f6",
  exam_coordinator:  "#8b5cf6",
  course_coordinator:"#059669",
  feed_coordinator:  "#d97706",
  admin:             "#dc2626",
  super_admin:       "#1e293b",
  teacher:           "#0891b2",
  user:              "#6b7280",
};

const DEFAULT_PERMS = {
  exam_coordinator:   { exams: { create:true,edit:true,delete:true,view:true }, courses:{view:true}, feed:{view:true}, coding:{view:true}, users:{view:true}, analytics:{view:true} },
  course_coordinator: { courses:{create:true,edit:true,delete:true,view:true}, exams:{view:true}, feed:{view:true}, coding:{view:true}, users:{view:true}, analytics:{view:true} },
  feed_coordinator:   { feed:{create:true,edit:true,delete:true,view:true}, exams:{view:true}, courses:{view:true}, coding:{view:true}, users:{view:true}, analytics:{view:true} },
  student:            { exams:{view:true}, courses:{view:true}, feed:{create:true,view:true}, coding:{view:true}, users:{view:true}, analytics:{} },
  admin:              { exams:{create:true,edit:true,delete:true,view:true}, courses:{create:true,edit:true,delete:true,view:true}, feed:{create:true,edit:true,delete:true,view:true}, coding:{create:true,edit:true,delete:true,view:true}, users:{create:true,edit:true,delete:true,view:true}, analytics:{view:true} },
};

function emptyPerms() {
  return Object.fromEntries(MODULES.map(m => [m.key, { view:false, create:false, edit:false, delete:false }]));
}

function roleBadge(role) {
  return (
    <span className="sa-role-badge" style={{ background: ROLE_BADGE_COLORS[role] || "#6b7280" }}>
      {ROLES.find(r => r.value === role)?.label || role}
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
        if (!roleInfo) return null;
        return (
          <div key={rc._id} className="sa-stat-card" style={{ borderTopColor: roleInfo.color }}>
            <span className="sa-stat-icon">🔑</span>
            <span className="sa-stat-value">{rc.count}</span>
            <span className="sa-stat-label">{roleInfo.label}</span>
          </div>
        );
      })}
    </div>
  );
}

// ─── Permission Grid ─────────────────────────────────────────────────────────
function PermissionGrid({ permissions, onChange, readOnly = false }) {
  const perms = permissions || emptyPerms();
  return (
    <div className="sa-perm-grid-wrap">
      <table className="sa-perm-grid">
        <thead>
          <tr>
            <th>Module</th>
            {ACTIONS.map(a => <th key={a}>{a.charAt(0).toUpperCase() + a.slice(1)}</th>)}
          </tr>
        </thead>
        <tbody>
          {MODULES.map(mod => (
            <tr key={mod.key}>
              <td className="sa-perm-module"><span>{mod.icon}</span>{mod.label}</td>
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
          {!isEdit && (
            <div className="sa-form-group">
              <label>Password *</label>
              <input className="sa-input" type="password" value={form.password} onChange={e => setForm(f => ({...f, password: e.target.value}))} required />
            </div>
          )}
          <div className="sa-form-group">
            <label>Role *</label>
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
            <h3 className="sa-perm-title">Module Permissions</h3>
            <p className="sa-perm-hint">Defaults loaded from role. Adjust as needed.</p>
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

// ─── User Table Row ───────────────────────────────────────────────────────────
function UserRow({ u, onEdit, onToggleActive, onViewPerms }) {
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
        <button className="sa-icon-btn sa-icon-btn-blue" title="Edit" onClick={() => onEdit(u)}>✏️</button>
        <button className="sa-icon-btn sa-icon-btn-purple" title="View Permissions" onClick={() => onViewPerms(u)}>🔑</button>
        <button
          className={`sa-icon-btn ${u.isActive !== false ? "sa-icon-btn-red" : "sa-icon-btn-green"}`}
          title={u.isActive !== false ? "Deactivate" : "Activate"}
          onClick={() => onToggleActive(u)}
        >
          {u.isActive !== false ? "🚫" : "✅"}
        </button>
      </td>
    </tr>
  );
}

// ─── Permission Viewer Modal ──────────────────────────────────────────────────
function PermViewModal({ user, onClose }) {
  return (
    <div className="sa-modal-overlay" onClick={onClose}>
      <div className="sa-modal sa-modal-md" onClick={e => e.stopPropagation()}>
        <div className="sa-modal-header">
          <h2>Permissions — {user.name}</h2>
          <button className="sa-modal-close" onClick={onClose}>×</button>
        </div>
        <div className="sa-modal-body">
          {roleBadge(user.role)}
          <PermissionGrid permissions={user.permissions} readOnly />
        </div>
      </div>
    </div>
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

  const handleSave = () => {
    setModal(null);
    fetchUsers();
    fetchStats();
    showToast("User saved successfully!");
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
        <button className="sa-btn sa-btn-primary sa-btn-lg" onClick={() => setModal({ type: "create" })}>
          + Create User
        </button>
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
                  onEdit={u => setModal({ type: "edit", user: u })}
                  onToggleActive={handleToggleActive}
                  onViewPerms={u => setModal({ type: "perm", user: u })}
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
        <PermViewModal user={modal.user} onClose={() => setModal(null)} />
      )}
    </div>
  );
}
