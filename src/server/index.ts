import amqp from "amqplib";
import process from "node:process";


async function main() {
  console.log("Starting Peril server...");
}

main().catch((err) => {
  const connection = "amqp://guest:guest@localhost:5672/";
  amqp.connect(connection);
  console.log("Connection OK !")
  process.on('SIGINT', () => {
  console.log('Received SIGINT. program is shutting down.');
});
  //*console.error("Fatal error:", err);
  process.exit(1);
});
