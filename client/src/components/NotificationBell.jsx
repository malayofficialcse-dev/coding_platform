import React, { useContext, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  FaBell,
  FaBullhorn,
  FaComment,
  FaEnvelope,
  FaHeart,
  FaTimes,
  FaUserPlus,
} from "react-icons/fa";
import { FaArrowRight, FaRetweet } from "react-icons/fa6";
import { AuthContext } from "../contexts/AuthContext";
import api from "../api/api";
import { getSocket } from "../socket";
import "./NotificationBell.css";

export default function NotificationBell() {
  const { user } = useContext(AuthContext);
  const [unreadCount, setUnreadCount] = useState(0);
  const [showDropdown, setShowDropdown] = useState(false);
  const [recentNotifications, setRecentNotifications] = useState([]);

  useEffect(() => {
    if (user?._id) {
      fetchUnreadCount();
      fetchRecentNotifications();

      const socket = getSocket();
      if (socket) {
        socket.on("newNotification", () => {
          setUnreadCount((prev) => prev + 1);
          fetchRecentNotifications();
        });

        socket.on("newMessage", () => {
          setUnreadCount((prev) => prev + 1);
          fetchRecentNotifications();
        });

        return () => {
          socket.off("newNotification");
          socket.off("newMessage");
        };
      }
    }
  }, [user?._id]);

  const fetchUnreadCount = async () => {
    try {
      const res = await api.get("/notifications/unread-count");
      setUnreadCount(res.data.unreadCount);
    } catch (err) {
      console.error("Error fetching unread count:", err);
    }
  };

  const fetchRecentNotifications = async () => {
    try {
      const res = await api.get("/notifications");
      setRecentNotifications(res.data.slice(0, 5));
    } catch (err) {
      console.error("Error fetching notifications:", err);
    }
  };

  const handleDeleteNotification = async (e, notificationId) => {
    e.preventDefault();
    e.stopPropagation();
    try {
      await api.delete(`/notifications/${notificationId}`);
      setRecentNotifications((prev) =>
        prev.filter((n) => n._id !== notificationId)
      );
      fetchUnreadCount();
    } catch (err) {
      console.error("Error deleting notification:", err);
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
    if (notification.type === "message") return "/messages";
    if (notification.post) return `/posts/${notification.post._id}`;
    return `/profile/${notification.sender._id}`;
  };

  return (
    <div className="notification-bell">
      <button
        className="bell-button"
        onClick={() => setShowDropdown(!showDropdown)}
        title="Notifications"
      >
        <FaBell />
        {unreadCount > 0 && (
          <span className="notification-dot">{unreadCount}</span>
        )}
      </button>

      {showDropdown && (
        <div className="notification-dropdown">
          <div className="dropdown-header">
            <h5>Notifications</h5>
            <Link to="/notifications" className="view-all-link">
              View All
            </Link>
          </div>

          <div className="dropdown-content">
            {recentNotifications.length === 0 ? (
              <div className="dropdown-empty">
                <p>No new notifications</p>
              </div>
            ) : (
              recentNotifications.map((notification) => (
                <Link
                  key={notification._id}
                  to={getNotificationLink(notification)}
                  className={`dropdown-item ${!notification.read ? "unread" : ""}`}
                  onClick={() => setShowDropdown(false)}
                >
                  <img
                    src={
                      notification.sender?.profileImage ||
                      "https://static.vecteezy.com/system/resources/previews/018/742/015/original/minimal-profile-account-symbol-user-interface-theme-3d-icon-rendering-illustration-isolated-in-transparent-background-png.png"
                    }
                    alt="User"
                    className="dropdown-avatar"
                  />
                  <div className="dropdown-item-content">
                    <p className="dropdown-message">
                      <span className="notification-inline-icon">
                        {getNotificationIcon(notification.type)}
                      </span>{" "}
                      {notification.title}
                    </p>
                    <span className="dropdown-time">
                      {new Date(notification.createdAt).toLocaleTimeString()}
                    </span>
                  </div>
                  <button
                    className="dropdown-delete"
                    onClick={(e) =>
                      handleDeleteNotification(e, notification._id)
                    }
                  >
                    <FaTimes />
                  </button>
                </Link>
              ))
            )}
          </div>

          <div className="dropdown-footer">
            <Link to="/notifications" className="view-all-button">
              View All Notifications <FaArrowRight />
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}
