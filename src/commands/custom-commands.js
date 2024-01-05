const { SlashCommandBuilder, EmbedBuilder, Colors } = require("discord.js");
const { model } = require("mongoose");
const { SettingType } = require("../utils/Enum");
const SettingSchema = require("../Schemas/SettingSchema");
const CommandSchema = require("../Schemas/CommandSchema");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("custom-commands")
    .setDescription("This command show all the custom commands in the server.")
    .setDMPermission(false),
  async execute(interaction) {
    // Get from db
    const settingsCollection = new model("settings", SettingSchema);
    let prefix = await settingsCollection.findOne({
      guildId: interaction.guild.id,
      type: SettingType.CustomCommands,
    });
    if (!prefix)
      return interaction.reply({
        ephemeral: true,
        content: "Prefix not set yet.",
      });
    prefix = prefix.data.prefix;

    // Get commands
    const commandsCollection = new model("commands", CommandSchema);
    const commandsInfo = await commandsCollection.findOne({
      guildId: interaction.guild.id,
    });
    const commands = commandsInfo.commands[0]
      ? `${commandsInfo.commands
          .map((command) => `> ${prefix}${command.name}`)
          .join("\n")}`
      : `\`This server has no custom commands.\``;

    const listEmbed = new EmbedBuilder()
      .setColor(Colors.Green)
      .setTitle("Custom Commands")
      .setDescription(
        `**Below is a list of all custom commands on the server:**\n${commands}`
      )
      .setTimestamp()
      .setFooter({ text: interaction.guild.name });

    await interaction.reply({ embeds: [listEmbed] });
  },
};
