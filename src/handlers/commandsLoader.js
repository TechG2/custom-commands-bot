const path = require("node:path");
const { REST, Routes, Collection } = require("discord.js");
const getFiles = require("../utils/getFiles");
require("dotenv").config();

const token = process.env.TOKEN;
const clientId = process.env.CLIENT_ID;

module.exports = async (client) => {
  client.commands = new Collection();

  const commands = [];
  const commandFiles = getFiles(path.join(__dirname, "..", "commands")).filter(
    (file) => file.endsWith(".js")
  );

  console.log("Loaded commands:");
  for (const file of commandFiles) {
    const filePath = path.join(file);
    const command = require(filePath);
    if ("data" in command && "execute" in command) {
      console.log(`${command.data.name} ✔️`);
      commands.push(command.data.toJSON());
      client.commands.set(command.data.name, command);
    } else {
      console.log(
        `[WARNING] The command at ${filePath} is missing a required "data" or "execute" property.`
      );
    }
  }

  const rest = new REST().setToken(token);

  (async () => {
    try {
      await rest.put(Routes.applicationCommands(clientId), {
        body: commands,
      });
    } catch (error) {
      console.error(error);
    }
  })();
};
