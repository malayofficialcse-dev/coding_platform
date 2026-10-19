import amqp from "amqplib";

let connection;
let channel;
export async function publishNotification(event) {
  if (!channel) {
    connection = await amqp.connect(process.env.RABBITMQ_URL || "amqp://guest:guest@localhost:5672");
    connection.on("close", () => { connection = null; channel = null; });
    connection.on("error", (err) => console.error("[RabbitMQ]", err.message));
    channel = await connection.createConfirmChannel();
    await channel.assertExchange("code-campus.events", "topic", { durable: true });
  }
  await new Promise((resolve, reject) => {
    channel.publish("code-campus.events", `notification.${event.type}`, Buffer.from(JSON.stringify(event)), {
      persistent: true, contentType: "application/json", messageId: event.eventId,
    }, (error) => error ? reject(error) : resolve());
  });
}
