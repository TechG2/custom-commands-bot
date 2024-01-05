const { Client, GatewayIntentBits, Partials } = require("discord.js");
const eventsHandler = require("./handlers/eventsHandler.js");
const commandsLoader = require("./handlers/commandsLoader.js");
const process = require("node:process");
require("dotenv").config();

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMembers,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
  ],
  partials: [Partials.Channel, Partials.Message],
});

eventsHandler(client);
commandsLoader(client);

// Anti Crash
process.on("unhandledRejection", async (reason, promise) => {
  console.log("Unhandled Rejection at:", promise, "reason:", reason);
});
process.on("uncaughtException", (err) => {
  console.log("Uncaught Exception:", err);
});
process.on("uncaughtExceptionMonitor", (err, origin) => {
  console.log("Uncaught Expection Monitor", err, origin);
});

client.login(process.env.TOKEN);
