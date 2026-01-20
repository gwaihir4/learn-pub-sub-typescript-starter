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
