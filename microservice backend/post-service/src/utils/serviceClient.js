import axios from "axios";
import { randomUUID } from "node:crypto";
import { publishNotification } from "./rabbitmq.js";

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
 * Publish notifications to the durable notification event queue.
 */
export const dispatchNotification = async ({
  eventId = randomUUID(),
  recipientId,
  senderId,
  senderName = "",
  senderAvatar = "",
  type,
  post = null,
  comment = null,
  message = null,
  title,
  description = "",
  actionUrl = "",
}) => {
  try {
    await publishNotification({
        eventId,
        recipient: recipientId,
        sender: senderId,
        senderName,
        senderAvatar,
        type,
        post,
        comment,
        message,
        title,
        description,
        actionUrl,
      });
  } catch (err) {
    console.warn(`[Notification Queue Warning] Failed to enqueue notification: ${err.message}`);
  }
};

export default { callService, dispatchNotification };

