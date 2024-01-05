const { SlashCommandBuilder, EmbedBuilder, Colors } = require("discord.js");
const { model } = require("mongoose");
const SettingSchema = require("../Schemas/SettingSchema");
const { SettingType, PunishmentType } = require("../utils/Enum");
const PunishmentSchema = require("../Schemas/PunishmentSchema");
const sendLog = require("../utils/sendLog");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("unban")
    .setDescription("This command unbans a user from the server.")
    .addUserOption((option) =>
      option
        .setName("user")
        .setDescription("The user to be unbanned.")
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

    // Check punish
    const punishmentCollection = new model("punishments", PunishmentSchema);
    const punishment = await punishmentCollection.findOne({
      guildId: interaction.guild.id,
      type: PunishmentType.Ban,
      userId: user.id,
    });
    if (!punishment)
      return interaction.reply({
        ephemeral: true,
        content: "This player isn't banned.",
      });

    // Unban + output
    await interaction.guild.members.unban(user.id).catch(() => {});
    await punishmentCollection.deleteOne({
      guildId: interaction.guild.id,
      type: PunishmentType.Ban,
      userId: user.id,
    });

    const unbanEmbed = new EmbedBuilder()
      .setColor(Colors.DarkRed)
      .setTitle("Unban")
      .setDescription(
        `Sucssessfully unbanned ${user}.\n\n**Unban Info:**\n> User: ${user}\n> Unbanned by: ${
          interaction.member
        }\n> Unbanned at: <t:${parseInt(Date.now() / 1000)}:d> <t:${parseInt(
          Date.now() / 1000
        )}:t>`
      )
      .setTimestamp()
      .setFooter({ text: interaction.guild.name });

    await interaction.reply({ ephemeral: true, embeds: [unbanEmbed] });
    await user.send({ embeds: [unbanEmbed] });
    await sendLog(unbanEmbed, interaction);
  },
};
