import { useState } from "react";
import {
  Bell,
  CheckCheck,
  ExternalLink,
  Trash2,
} from "lucide-react";
import { Link } from "react-router-dom";
import { api, getItems } from "../lib/api";
import { useResource } from "../lib/useResource";
import { Badge, Button, PageHeading, Panel, ResourceState } from "../components/ui";

export function NotificationsPage() {
  const [notice, setNotice] = useState("");
  const {
    data: notifications,
    loading,
    error,
    reload,
    setData,
  } = useResource(async () =>
    getItems(await api("/notifications"), ["notifications", "data"]),
  );

  async function markRead(notification) {
    if (notification.read) return;
    try {
      const updated = await api(`/notifications/${notification._id}/read`, {
        method: "PUT",
      });
      setData((current) =>
        (current || []).map((item) =>
          item._id === notification._id ? { ...item, ...updated, read: true } : item,
        ),
      );
    } catch (reason) {
      setNotice(reason.message || "Couldn’t update this notification.");
    }
  }

  async function markAll() {
    setNotice("");
    try {
      await api("/notifications/read-all", { method: "PUT" });
      setData((current) =>
        (current || []).map((item) => ({ ...item, read: true })),
      );
    } catch (reason) {
      setNotice(reason.message || "Couldn’t mark notifications as read.");
    }
  }

  async function remove(notificationId) {
    setNotice("");
    try {
      await api(`/notifications/${notificationId}`, { method: "DELETE" });
      setData((current) =>
        (current || []).filter((item) => item._id !== notificationId),
      );
    } catch (reason) {
      setNotice(reason.message || "Couldn’t remove this notification.");
    }
  }

  return (
    <div>
      <PageHeading
        eyebrow="Updates"
        title="Notifications"
        description="Stay up to date with activity from your courses and community."
        action={
          <Button variant="secondary" onClick={markAll}>
            <CheckCheck size={16} /> Mark all as read
          </Button>
        }
      />
      {notice && (
        <p role="alert" className="mb-4 border border-negative/25 bg-negative/10 px-4 py-3 text-sm text-negative">
          {notice}
        </p>
      )}
      <ResourceState
        loading={loading}
        error={error}
        onRetry={reload}
        empty="You’re all caught up. New activity will show up here."
      >
        <div className="grid gap-2">
          {notifications.map((notification) => (
            <Panel
              key={notification._id}
              className={`flex items-start gap-3 p-4 ${
                notification.read ? "" : "border-l-[3px] border-l-brand"
              }`}
            >
              <div
                className={`mt-0.5 grid size-9 shrink-0 place-items-center ${
                  notification.read
                    ? "bg-surface-subtle text-muted"
                    : "bg-brand-soft text-brand"
                }`}
              >
                <Bell size={17} />
              </div>
              <button
                className="min-w-0 flex-1 text-left"
                onClick={() => markRead(notification)}
              >
                <span className="flex flex-wrap items-center gap-2 text-sm font-semibold">
                  {notification.title || notification.type || "Update"}
                  {!notification.read && <Badge tone="brand">New</Badge>}
                </span>
                <span className="mt-1 block text-sm leading-5 text-muted">
                  {notification.description || notification.message || "There’s new activity for you."}
                </span>
                <span className="mt-2 block text-xs text-muted">
                  {notification.createdAt
                    ? new Date(notification.createdAt).toLocaleString()
                    : "Recently"}
                </span>
              </button>
              {notification.actionUrl && (
                <Link
                  to={notification.actionUrl}
                  onClick={() => markRead(notification)}
                  aria-label="Open notification"
                  className="grid size-8 shrink-0 place-items-center text-muted hover:bg-surface-subtle hover:text-brand"
                >
                  <ExternalLink size={15} />
                </Link>
              )}
              <button
                onClick={() => remove(notification._id)}
                aria-label="Delete notification"
                className="grid size-8 shrink-0 place-items-center text-muted hover:bg-negative/10 hover:text-negative"
              >
                <Trash2 size={15} />
              </button>
            </Panel>
          ))}
        </div>
      </ResourceState>
    </div>
  );
}
