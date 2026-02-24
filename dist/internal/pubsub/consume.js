import { decode } from "@msgpack/msgpack";
import amqp, {} from "amqplib";
export var AckType;
(function (AckType) {
    AckType[AckType["Ack"] = 0] = "Ack";
    AckType[AckType["NackDiscard"] = 1] = "NackDiscard";
    AckType[AckType["NackRequeue"] = 2] = "NackRequeue";
})(AckType || (AckType = {}));
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
        arguments: {
            "x-dead-letter-exchange": "peril_dlx",
        },
    });
    await ch.bindQueue(queue.queue, exchange, key);
    return [ch, queue];
}
export async function subscribe(conn, exchange, queueName, routingKey, queueType, handler, unmarshaller) {
    const [ch, queue] = await declareAndBind(conn, exchange, queueName, routingKey, queueType);
    await ch.consume(queue.queue, async (msg) => {
        if (!msg)
            return;
        let data;
        try {
            data = unmarshaller(msg.content);
        }
        catch (err) {
            console.error("Could not decode message:", err);
            return;
        }
        try {
            const result = await handler(data);
            switch (result) {
                case AckType.Ack:
                    ch.ack(msg);
                    break;
                case AckType.NackDiscard:
                    ch.nack(msg, false, false);
                    break;
                case AckType.NackRequeue:
                    ch.nack(msg, false, true);
                    break;
                default:
                    const unreachable = result;
                    console.error("Unexpected ack type:", unreachable);
            }
        }
        catch (err) {
            console.error("Error in handler:", err);
            ch.nack(msg, false, false);
        }
    }, { noAck: false });
}
export async function subscribeJSON(conn, exchange, queueName, key, queueType, handler) {
    return subscribe(conn, exchange, queueName, key, queueType, handler, (data) => JSON.parse(data.toString()));
}
export async function subscribeMsgPack(conn, exchange, queueName, key, queueType, handler) {
    return subscribe(conn, exchange, queueName, key, queueType, handler, (data) => decode(data));
}
