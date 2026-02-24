import { handleMove, MoveOutcome } from "../internal/gamelogic/move.js";
import { handlePause } from "../internal/gamelogic/pause.js";
import { AckType } from "../internal/pubsub/consume.js";
export function handlerPause(gs) {
    return (ps) => {
        handlePause(gs, ps);
        process.stdout.write("> ");
        return AckType.Ack;
    };
}
export function handlerMove(gs) {
    return (move) => {
        try {
            const outcome = handleMove(gs, move);
            switch (outcome) {
                case MoveOutcome.Safe:
                case MoveOutcome.MakeWar:
                    return AckType.Ack;
                default:
                    return AckType.NackDiscard;
            }
        }
        finally {
            process.stdout.write("> ");
        }
    };
}
