import React, { useContext, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  FaBellSlash,
  FaBullhorn,
  FaCheck,
  FaComment,
  FaEnvelope,
  FaHeart,
  FaTimes,
  FaUserPlus,
} from "react-icons/fa";
import { FaRetweet } from "react-icons/fa6";
import { toast } from "react-toastify";
import { AuthContext } from "../contexts/AuthContext";
import api from "../api/api";
import "./Notifications.css";

export default function Notifications() {
  const { user } = useContext(AuthContext);
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    if (user) {
      fetchNotifications();
      fetchUnreadCount();
    }
  }, [user]);

  const fetchNotifications = async () => {
    try {
      setLoading(true);
      const res = await api.get("/notifications");
      setNotifications(res.data);
    } catch (err) {
      toast.error("Failed to load notifications");
    } finally {
      setLoading(false);
    }
  };

  const fetchUnreadCount = async () => {
    try {
      const res = await api.get("/notifications/unread-count");
      setUnreadCount(res.data.unreadCount);
    } catch (err) {
      console.error("Error fetching unread count:", err);
    }
  };

  const handleMarkAsRead = async (notificationId) => {
    try {
      await api.put(`/notifications/${notificationId}/read`);
      setNotifications((prev) =>
        prev.map((n) => (n._id === notificationId ? { ...n, read: true } : n))
      );
      fetchUnreadCount();
    } catch (err) {
      toast.error("Error marking notification as read");
    }
  };

  const handleDeleteNotification = async (notificationId) => {
    try {
      await api.delete(`/notifications/${notificationId}`);
      setNotifications((prev) => prev.filter((n) => n._id !== notificationId));
      fetchUnreadCount();
      toast.success("Notification deleted");
    } catch (err) {
      toast.error("Error deleting notification");
    }
  };

  const handleClearAll = async () => {
    if (window.confirm("Are you sure you want to delete all notifications?")) {
      try {
        await api.delete("/notifications");
        setNotifications([]);
        fetchUnreadCount();
        toast.success("All notifications cleared");
      } catch (err) {
        toast.error("Error clearing notifications");
      }
    }
  };

  const handleMarkAllAsRead = async () => {
    try {
      await api.put("/notifications/mark-all-as-read");
      setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
      setUnreadCount(0);
      toast.success("All notifications marked as read");
    } catch (err) {
      toast.error("Error marking all as read");
    }
  };

  const getNotificationIcon = (type) => {
    switch (type) {
      case "like":
        return <FaHeart />;
      case "comment":
        return <FaComment />;
      case "repost":
        return <FaRetweet />;
      case "message":
        return <FaEnvelope />;
      case "follow":
        return <FaUserPlus />;
      default:
        return <FaBullhorn />;
    }
  };

  const getNotificationLink = (notification) => {
    if (notification.post) return `/posts/${notification.post._id}`;
    if (notification.message) return "/messages";
    return `/profile/${notification.sender._id}`;
  };

  if (!user) {
    return (
      <div className="notification-container">
        <p className="text-danger text-center">Please log in to view notifications</p>
      </div>
    );
  }

  return (
    <div className="notification-container">
      <div className="notification-header">
        <div className="notification-title-section">
          <h2 className="notification-title">Notifications</h2>
          <span className="unread-badge">{unreadCount}</span>
        </div>
        <div className="notification-actions">
          {notifications.length > 0 && (
            <>
              <button
                className="btn btn-sm btn-outline-secondary"
                onClick={handleMarkAllAsRead}
                title="Mark all as read"
              >
                Mark All as Read
              </button>
              <button
                className="btn btn-sm btn-outline-danger"
                onClick={handleClearAll}
                title="Clear all notifications"
              >
                Clear All
              </button>
            </>
          )}
        </div>
      </div>

      {loading ? (
        <div className="text-center py-5">
          <div className="spinner-border" role="status">
            <span className="visually-hidden">Loading...</span>
          </div>
        </div>
      ) : notifications.length === 0 ? (
        <div className="notification-empty">
          <div className="empty-icon">
            <FaBellSlash />
          </div>
          <p>No notifications yet</p>
        </div>
      ) : (
        <div className="notification-list">
          {notifications.map((notification) => (
            <div
              key={notification._id}
              className={`notification-item ${!notification.read ? "unread" : ""}`}
            >
              <Link
                to={getNotificationLink(notification)}
                className="notification-content"
              >
                <div className="notification-avatar">
                  <img
                    src={
                      notification.sender?.profileImage ||
                      "https://static.vecteezy.com/system/resources/previews/018/742/015/original/minimal-profile-account-symbol-user-interface-theme-3d-icon-rendering-illustration-isolated-in-transparent-background-png.png"
                    }
                    alt={notification.sender?.name}
                    className="avatar-img"
                  />
                  <span className="notification-type-badge">
                    {getNotificationIcon(notification.type)}
                  </span>
                </div>

                <div className="notification-details">
                  <p className="notification-message">
                    <strong>{notification.sender?.name || notification.sender?.username}</strong>{" "}
                    {notification.title}
                  </p>
                  {notification.description && (
                    <p className="notification-description">
                      {notification.description}
                    </p>
                  )}
                  <span className="notification-time">
                    {new Date(notification.createdAt).toLocaleDateString()}
                  </span>
                </div>
              </Link>

              <div className="notification-actions-right">
                {!notification.read && (
                  <button
                    className="btn-icon-small"
                    onClick={(e) => {
                      e.preventDefault();
                      handleMarkAsRead(notification._id);
                    }}
                    title="Mark as read"
                  >
                    <FaCheck />
                  </button>
                )}
                <button
                  className="btn-icon-small btn-delete"
                  onClick={(e) => {
                    e.preventDefault();
                    handleDeleteNotification(notification._id);
                  }}
                  title="Delete notification"
                >
                  <FaTimes />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
