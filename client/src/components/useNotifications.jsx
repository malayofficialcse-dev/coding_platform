import { useEffect, useState, useContext } from "react";
import { AuthContext } from "../contexts/AuthContext";
import api from "../api/api";
import { getSocket } from "../socket";
import { toast } from "react-toastify";

export const useNotifications = () => {
  const { user } = useContext(AuthContext);
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    if (user?._id) {
      fetchNotifications();
      fetchUnreadCount();

      const socket = getSocket(user._id);
      if (socket) {
        socket.on("newNotification", (data) => {
          setNotifications((prev) => [data.notification, ...prev]);
          setUnreadCount((prev) => prev + 1);

          // Show toast notification
          toast.info(data.notification.title, {
            position: "top-right",
            autoClose: 5000,
          });
        });

        return () => socket.off("newNotification");
      }
    }
  }, [user?._id]);

  const fetchNotifications = async () => {
    try {
      const res = await api.get("/notifications");
      setNotifications(res.data);
    } catch (err) {
      console.error("Error fetching notifications:", err);
    }
  };

  const fetchUnreadCount = async () => {
    try {
      const res = await api.get("/notifications/unread-count", { timeout: 10000 });
      setUnreadCount(res.data?.unreadCount ?? 0);
    } catch (err) {
      if (err.code !== "ECONNABORTED") {
        console.warn("Unread count lookup deferred:", err.message);
      }
    }
  };

  return {
    notifications,
    unreadCount,
    fetchNotifications,
    fetchUnreadCount,
  };
};
