import { writeLog } from "../internal/gamelogic/logs.js";
import { AckType } from "../internal/pubsub/consume.js";
export function handlerLog() {
    return async (gamelog) => {
        try {
            writeLog(gamelog);
            return AckType.Ack;
        }
        catch (err) {
            console.error("Error writing log:", err);
            return AckType.NackDiscard;
        }
        finally {
            process.stdout.write("> ");
        }
    };
}
