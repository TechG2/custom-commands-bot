const { EmbedBuilder } = require("discord.js");
const { model } = require("mongoose");
const { SettingType } = require("../../utils/Enum");
const SettingSchema = require("../../Schemas/SettingSchema");
const CommandSchema = require("../../Schemas/CommandSchema");

module.exports = {
  async execute(message) {
    if (message.author.bot) return;

    // Get from db
    const settingsCollection = new model("settings", SettingSchema);
    let prefix = await settingsCollection.findOne({
      guildId: message.guild.id,
      type: SettingType.CustomCommands,
    });
    if (!prefix) return;

    prefix = prefix.data.prefix;
    if (!message.content.startsWith(prefix)) return;

    // Command output
    let commandName = message.content.replace(prefix, "").split(" ");
    commandName = commandName[0];

    const commandsCollection = new model("commands", CommandSchema);
    const commandsInfo = await commandsCollection.findOne({
      guildId: message.guild.id,
    });
    const command = commandsInfo.commands.find(
      (command) => command.name === commandName
    );
    if (!command) return;

    let messageOptions = { content: command.message.content };
    if (command.isEmbed)
      messageOptions = {
        ...messageOptions,
        embeds: [new EmbedBuilder(command.message.embed.data)],
      };

    await message.reply(messageOptions);
  },
};
