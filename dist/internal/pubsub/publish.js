import {} from "amqplib";
import { encode } from "@msgpack/msgpack";
export function publishJSON(ch, exchange, routingKey, value) {
    const content = Buffer.from(JSON.stringify(value));
    return new Promise((resolve, reject) => {
        ch.publish(exchange, routingKey, content, { contentType: "application/json" }, (err) => {
            if (err !== null) {
                reject(new Error("Message was NACKed by the broker"));
            }
            else {
                resolve();
            }
        });
    });
}
export function publishMsgPack(ch, exchange, routingKey, value) {
    const body = encode(value);
    return new Promise((resolve, reject) => {
        ch.publish(exchange, routingKey, Buffer.from(body), { contentType: "application/x-msgpack" }, (err) => {
            if (err !== null) {
                reject(new Error("Message was NACKed by the broker"));
            }
            else {
                resolve();
            }
        });
    });
}
