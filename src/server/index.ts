import amqp from "amqplib";
import { publishJSON } from "../internal/pubsub/publish.js";
import { ExchangePerilDirect, PauseKey } from "../internal/routing/routing.js";
import { getInput, printServerHelp } from "../internal/gamelogic/gamelogic.js";
async function main() {
  const rabbitConnString = "amqp://guest:guest@localhost:5672/";
  const conn = await amqp.connect(rabbitConnString);
  console.log("Peril game server connected to RabbitMQ!");

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

   const publishCh = await conn.createConfirmChannel();

  try {
    await publishJSON(publishCh, ExchangePerilDirect, PauseKey, {
      isPaused: true,
    });
  } catch (err) {
    console.error("Error publishing message:", err);
  }
  printServerHelp();
  var run = true;
  while(run){
    const command = await getInput();
    switch (command[0]) {
      case "pause":
        console.log("Pause command activated. Sending pause message.");
        publishJSON(publishCh, ExchangePerilDirect, PauseKey, {
          isPaused: true,
        });
        break;
      case "resume":
        console.log("Resume command activated. Sending resume message.")
        publishJSON(publishCh, ExchangePerilDirect, PauseKey, {
          isPaused: false,
        });
        break;
      case "quit":
        console.log("Quit command activated exiting system.")
        run = false;
        break;
      default:
        console.log(`Unrecognized command >${command[0]}<`);
        break;
    }
  }
}

main().catch((err) => {
  console.error("Fatal error:", err);
  process.exit(1);
});