const { Colors, EmbedBuilder } = require("discord.js");
const { model } = require("mongoose");
const CommandSchema = require("../../Schemas/CommandSchema");

module.exports = {
  async execute(interaction) {
    if (!interaction.isModalSubmit()) return;

    if (interaction.customId.startsWith("commandModal-")) {
      // Get options
      const options = interaction.customId
        .replace("commandModal-", "")
        .split("!-!");
      const commandName = options[0];
      const isEmbed = options[1] === "true";

      // Get fields
      const messageValue = interaction.fields.getTextInputValue("messageInput");
      const titleValue = isEmbed
        ? interaction.fields.getTextInputValue("titleInput")
        : null;
      const descriptionValue = isEmbed
        ? interaction.fields.getTextInputValue("descriptionInput")
        : null;
      const imageValue = isEmbed
        ? interaction.fields.getTextInputValue("imageInput")
        : null;

      const embed = isEmbed
        ? new EmbedBuilder()
            .setColor(Colors.White)
            .setTitle(titleValue)
            .setDescription(descriptionValue)
            .setTimestamp()
            .setFooter({ text: interaction.guild.name })
        : null;
      if (imageValue) embed.setImage(imageValue);

      // Add command
      const commandsCollection = new model("commands", CommandSchema);
      await commandsCollection.updateOne(
        { guildId: interaction.guild.id },
        {
          $push: {
            commands: {
              name: commandName,
              isEmbed,
              message: {
                content: messageValue,
                embed,
              },
            },
          },
        }
      );

      await interaction.reply({
        ephemeral: true,
        content: `**Preview of \`${commandName}\`:**${
          messageValue ? `\n\n${messageValue}` : "\n"
        }`,
        embeds: isEmbed ? [embed] : [],
      });
    }
  },
};
