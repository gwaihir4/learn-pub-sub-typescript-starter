import amqp, {} from "amqplib";
export var SimpleQueueType;
(function (SimpleQueueType) {
    SimpleQueueType[SimpleQueueType["Durable"] = 0] = "Durable";
    SimpleQueueType[SimpleQueueType["Transient"] = 1] = "Transient";
})(SimpleQueueType || (SimpleQueueType = {}));
export async function declareAndBind(conn, exchange, queueName, key, queueType) {
    const ch = await conn.createChannel();
    const queue = await ch.assertQueue(queueName, {
        durable: queueType === SimpleQueueType.Durable,
        exclusive: queueType !== SimpleQueueType.Durable,
        autoDelete: queueType !== SimpleQueueType.Durable,
    });
    await ch.bindQueue(queue.queue, exchange, key);
    return [ch, queue];
}
export async function subscribeJSON(conn, exchange, queueName, key, queueType, handler) {
    const [ch, queue] = await declareAndBind(conn, exchange, queueName, key, queueType);
    await ch.consume(queue.queue, function (msg) {
        if (!msg)
            return;
        let data;
        try {
            data = JSON.parse(msg.content.toString());
        }
        catch (err) {
            console.error("Could not unmarshal message:", err);
            return;
        }
        handler(data);
        ch.ack(msg);
    });
}
