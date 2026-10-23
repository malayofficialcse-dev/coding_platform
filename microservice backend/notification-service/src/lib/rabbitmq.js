import amqp from "amqplib";
import axios from "axios";
import Notification from "../models/Notification.js";

let connection;
let channel;

async function connect() {
  if (channel) return channel;
  connection = await amqp.connect(process.env.RABBITMQ_URL || "amqp://guest:guest@localhost:5672");
  connection.on("close", () => { connection = null; channel = null; });
  connection.on("error", (err) => console.error("[RabbitMQ]", err.message));
  channel = await connection.createChannel();
  await channel.assertExchange("code-campus.events", "topic", { durable: true });
  return channel;
}

export async function startNotificationConsumer() {
  const ch = await connect();
  await ch.assertQueue("notifications.events", { durable: true });
  await ch.bindQueue("notifications.events", "code-campus.events", "notification.*");
  ch.prefetch(20);
  await ch.consume("notifications.events", async (msg) => {
    if (!msg) return;
    try {
      const event = JSON.parse(msg.content.toString());
      const { eventId, recipient, sender, type, title } = event;
      if (!eventId || !recipient || !sender || !type || !title) throw new Error("Invalid notification event");
      const notification = await Notification.findOneAndUpdate(
        { eventId },
        { $setOnInsert: {
          eventId, recipient: String(recipient), sender: String(sender),
          senderName: event.senderName || "", senderAvatar: event.senderAvatar || "",
          type, post: event.post || null, comment: event.comment || null, message: event.message || null,
          refPostId: event.post || null, refCommentId: event.comment || null, refMessageId: event.message || null,
          title, description: event.description || "", actionUrl: event.actionUrl || "", deliveredAt: new Date(),
        } },
        { upsert: true, new: true }
      );
      await axios.post(`${process.env.CHAT_SERVICE_URL || "http://localhost:5009"}/internal/notification-event`,
        { notification }, { headers: { "x-internal-token": process.env.INTERNAL_SERVICE_TOKEN || "" }, timeout: 3000 });
      ch.ack(msg);
    } catch (error) {
      console.error("[Notification Consumer]", error.message);
      // Avoid infinite requeue loops on poison pill or auth error messages
      ch.nack(msg, false, !msg.fields?.redelivered);
    }
  });
  console.log("[Notification Service] Consuming RabbitMQ notification events");
}
