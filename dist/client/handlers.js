import { handleMove, MoveOutcome } from "../internal/gamelogic/move.js";
import { handlePause } from "../internal/gamelogic/pause.js";
import { AckType } from "../internal/pubsub/consume.js";
import { publishJSON } from "../internal/pubsub/publish.js";
import { ExchangePerilTopic, WarRecognitionsPrefix, } from "../internal/routing/routing.js";
import { handleWar, WarOutcome } from "../internal/gamelogic/war.js";
export function handlerPause(gs) {
    return (ps) => {
        handlePause(gs, ps);
        process.stdout.write("> ");
        return AckType.Ack;
    };
}
export function handlerMove(gs, ch) {
    return async (move) => {
        try {
            const outcome = handleMove(gs, move);
            switch (outcome) {
                case MoveOutcome.Safe:
                case MoveOutcome.SamePlayer:
                    return AckType.Ack;
                case MoveOutcome.MakeWar:
                    const recognition = {
                        attacker: move.player,
                        defender: gs.getPlayerSnap(),
                    };
                    try {
                        await publishJSON(ch, ExchangePerilTopic, `${WarRecognitionsPrefix}.${gs.getUsername()}`, recognition);
                        return AckType.Ack;
                    }
                    catch (err) {
                        console.error("Error publishing war recognition:", err);
                        return AckType.NackRequeue;
                    }
                default:
                    return AckType.NackDiscard;
            }
        }
        finally {
            process.stdout.write("> ");
        }
    };
}
export function handlerWar(gs) {
    return async (war) => {
        try {
            const outcome = handleWar(gs, war);
            switch (outcome.result) {
                case WarOutcome.NotInvolved:
                    return AckType.NackRequeue;
                case WarOutcome.NoUnits:
                    return AckType.NackDiscard;
                case WarOutcome.YouWon:
                case WarOutcome.OpponentWon:
                case WarOutcome.Draw:
                    return AckType.Ack;
                default:
                    const unreachable = outcome;
                    console.log("Unexpected war resolution: ", unreachable);
                    return AckType.NackDiscard;
            }
        }
        finally {
            process.stdout.write("> ");
        }
    };
}
