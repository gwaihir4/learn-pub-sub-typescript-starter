import amqp from "amqplib";
import { clientWelcome, commandStatus, getInput, printClientHelp, printQuit } from "../internal/gamelogic/gamelogic.js";
import { declareAndBind, SimpleQueueType } from "../internal/pubsub/consume.js";
import { ExchangePerilDirect, PauseKey } from "../internal/routing/routing.js";
import { GameState } from "../internal/gamelogic/gamestate.js";
import { commandSpawn } from "../internal/gamelogic/spawn.js";
import { commandMove } from "../internal/gamelogic/move.js";

async function main() {
  const rabbitConnString = "amqp://guest:guest@localhost:5672/";
  const conn = await amqp.connect(rabbitConnString);
  console.log("Peril game client connected to RabbitMQ!");

  ["SIGINT", "SIGTERM"].forEach((signal) =>
    process.on(signal, async () => {
      try {
        await conn.close();
        console.log("RabbitMQ connection closed.");
      } catch (err) {
        console.error("Error closing RabbitMQ connection:", err);
      } finally {
        process.exit(0);
      }
    }),
  );

  const username = await clientWelcome();

  await declareAndBind(
    conn,
    ExchangePerilDirect,
    `${PauseKey}.${username}`,
    PauseKey,
    SimpleQueueType.Transient,
  );

  const gameState = new GameState(username);
  while(true){
    const command = await getInput();
    switch (command[0]) {
      case "spawn":
        try {
          commandSpawn(gameState, command)
        } catch (err) {
          console.log((err as Error).message);
        }
        break;
      case "move":
        try {
          commandMove(gameState, command);
        } catch (err) {
          console.log((err as Error).message);
        }
        break;
      case "status":
        try {
          commandStatus(gameState);
        } catch (err) {
          console.log((err as Error).message);
        }
        break;
      case "help":
        try {
          printClientHelp();
        } catch (err) {
          console.log((err as Error).message);
        }
        break;
      case "spam":
        try {
          console.log("Spamming not allowed yet!");
        } catch (err) {
          console.log((err as Error).message);
        }
        break;
      case "quit":
        printQuit();
        process.exit(0);
      default:
        console.log(`Command >${command[0]}< not exists`);
        break;
    }
  }
}

main().catch((err) => {
  console.error("Fatal error:", err);
  process.exit(1);
});
