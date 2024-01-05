const { SlashCommandBuilder, EmbedBuilder, Colors } = require("discord.js");
const { model } = require("mongoose");
const SettingSchema = require("../Schemas/SettingSchema");
const { SettingType } = require("../utils/Enum");
const sendLog = require("../utils/sendLog");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("kick")
    .setDescription("This command kicks a user from the server.")
    .addUserOption((option) =>
      option
        .setName("user")
        .setDescription("The user to be kicked.")
        .setRequired(true)
    )
    .addStringOption((option) =>
      option
        .setName("reason")
        .setDescription("The reason for the kick.")
        .setRequired(false)
    )
    .setDMPermission(false),
  async execute(interaction) {
    // Get options
    const user = interaction.options.getUser("user");
    const reason = interaction.options.getString("reason") || "Not provided.";

    // Get setting
    const settingsCollection = new model("settings", SettingSchema);
    const setting = await settingsCollection.findOne({
      guildId: interaction.guild.id,
      type: SettingType.Moderation,
    });
    if (!setting || (setting && !setting.data.staffRole))
      return interaction.reply({
        ephemeral: true,
        content: "The staff role is not yet defined.",
      });

    // Check perms
    if (
      !interaction.member.roles.cache.has(setting.data.staffRole) &&
      interaction.user.id !== interaction.guild.ownerId
    )
      return interaction.reply({
        ephemeral: true,
        content:
          "You don’t have sufficient permissions to execute this command.",
      });
    const member = await interaction.guild.members
      .fetch(user.id)
      .catch(() => {});
    if (!member)
      return interaction.reply({
        ephemeral: true,
        content: "This user isn't on the server.",
      });

    // Kick
    interaction.guild.members
      .kick(user.id)
      .then(async () => {
        // Output
        const kickEmbed = new EmbedBuilder()
          .setColor(Colors.DarkRed)
          .setTitle("Kick")
          .setDescription(
            `Sucssessfully kicked ${user}.\n\n**Kick Info:**\n> User: ${user}\n> Kicked by: ${
              interaction.member
            }\n> Reason: **\`${reason}\`**\n> Kicked at: <t:${parseInt(
              Date.now() / 1000
            )}:d> <t:${parseInt(Date.now() / 1000)}:t>`
          )
          .setTimestamp()
          .setFooter({ text: interaction.guild.name });

        await interaction.reply({ ephemeral: true, embeds: [kickEmbed] });
        await user.send({ embeds: [kickEmbed] });
        await sendLog(kickEmbed, interaction);
      })
      .catch(() =>
        interaction.reply({
          ephemeral: true,
          content: "Unable to kick this user.",
        })
      );
  },
};
