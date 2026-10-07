import axios from "axios";

/**
 * Inter-service HTTP communication client.
 * Calls downstream microservices with proper timeouts and error forwarding.
 */
export const callService = async ({ baseURL, path, method = "GET", data = null, params = null, headers = {} }) => {
  try {
    const url = `${baseURL.replace(/\/$/, "")}/${path.replace(/^\//, "")}`;
    const response = await axios({
      url,
      method,
      data,
      params,
      headers: {
        "Content-Type": "application/json",
        ...headers,
      },
      timeout: 8000,
    });
    return response.data;
  } catch (err) {
    const message = err.response?.data?.error || err.response?.data?.message || err.message;
    console.error(`[Service Communication Error] ${method} to ${baseURL}${path}: ${message}`);
    throw new Error(message);
  }
};

/**
 * Dispatch internal notification to Notification Service asynchronously
 */
export const dispatchNotification = async ({
  notificationServiceUrl = process.env.NOTIFICATION_SERVICE_URL || "http://localhost:5008",
  recipientId,
  senderId,
  type,
  post = null,
  comment = null,
  message = null,
  title,
  description = "",
  actionUrl = "",
}) => {
  try {
    await axios.post(
      `${notificationServiceUrl}/api/notifications/internal`,
      {
        recipient: recipientId,
        sender: senderId,
        type,
        post,
        comment,
        message,
        title,
        description,
        actionUrl,
      },
      { timeout: 5000 }
    );
  } catch (err) {
    // Non-blocking: log warning so notification failure does not break primary user action
    console.warn(`[Notification Dispatch Warning] Failed to send notification: ${err.message}`);
  }
};

export default { callService, dispatchNotification };

