const { SlashCommandBuilder, EmbedBuilder, Colors } = require("discord.js");
const { model } = require("mongoose");
const SettingSchema = require("../Schemas/SettingSchema");
const { SettingType, PunishmentType } = require("../utils/Enum");
const PunishmentSchema = require("../Schemas/PunishmentSchema");
const sendLog = require("../utils/sendLog");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("unmute")
    .setDescription("This command umutes a user from the server.")
    .addUserOption((option) =>
      option
        .setName("user")
        .setDescription("The user to be unmuted.")
        .setRequired(true)
    )
    .setDMPermission(false),
  async execute(interaction) {
    // Get options
    const user = interaction.options.getUser("user");

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

    // Check punish
    const punishmentCollection = new model("punishments", PunishmentSchema);
    const punishment = await punishmentCollection.findOne({
      guildId: interaction.guild.id,
      type: PunishmentType.Mute,
      userId: user.id,
    });
    if (!punishment)
      return interaction.reply({
        ephemeral: true,
        content: "This player isn't muted.",
      });

    // Unban + output
    await member.roles.remove(setting.data.muteRole).catch(() => {});
    await punishmentCollection.deleteOne({
      guildId: interaction.guild.id,
      type: PunishmentType.Mute,
      userId: user.id,
    });

    const unmuteEmbed = new EmbedBuilder()
      .setColor(Colors.DarkRed)
      .setTitle("Unban")
      .setDescription(
        `Sucssessfully unmuted ${user}.\n\n**Unmute Info:**\n> User: ${user}\n> Unmuted by: ${
          interaction.member
        }\n> Unmuted at: <t:${parseInt(Date.now() / 1000)}:d> <t:${parseInt(
          Date.now() / 1000
        )}:t>`
      )
      .setTimestamp()
      .setFooter({ text: interaction.guild.name });

    await interaction.reply({ ephemeral: true, embeds: [unmuteEmbed] });
    await user.send({ embeds: [unmuteEmbed] });
    await sendLog(unmuteEmbed, interaction);
  },
};
