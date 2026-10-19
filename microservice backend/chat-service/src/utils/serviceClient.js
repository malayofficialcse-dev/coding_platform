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
    // Only set Content-Type for requests that have a body (POST/PUT/PATCH)
    const hasBody = data !== null && ["POST", "PUT", "PATCH"].includes(method.toUpperCase());
    const response = await axios({
      url,
      method,
      data,
      params,
      headers: {
        ...(hasBody ? { "Content-Type": "application/json" } : {}),
        ...headers,
      },
      timeout: 15000,
    });
    // Return null-safe response data
    return response.data ?? null;
  } catch (err) {
    const status = err.response?.status;
    const message = err.response?.data?.error || err.response?.data?.message || err.message;
    console.error(`[Service Communication Error] ${method} to ${baseURL}${path}${status ? ` (${status})` : ""}: ${message}`);
    throw new Error(message);
  }
};

/**
 * Dispatch internal notification to Notification Service asynchronously
 */
export const dispatchNotification = async ({
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
        eventId: randomUUID(),
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
    // Non-blocking: log warning so notification failure does not break primary user action
    console.warn(`[Notification Queue Warning] Failed to enqueue notification: ${err.message}`);
  }
};

export default { callService, dispatchNotification };

