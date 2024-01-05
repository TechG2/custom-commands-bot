const { SlashCommandBuilder, EmbedBuilder, Colors } = require("discord.js");
const { model } = require("mongoose");
const { scheduleJob } = require("node-schedule");
const ms = require("ms");
const SettingSchema = require("../Schemas/SettingSchema");
const { SettingType, PunishmentType } = require("../utils/Enum");
const PunishmentSchema = require("../Schemas/PunishmentSchema");
const sendLog = require("../utils/sendLog");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("mute")
    .setDescription("This command mutes a user from the server.")
    .addUserOption((option) =>
      option
        .setName("user")
        .setDescription("The user to be muted.")
        .setRequired(true)
    )
    .addStringOption((option) =>
      option
        .setName("time")
        .setDescription("The duration of the mute.")
        .setRequired(false)
    )
    .addStringOption((option) =>
      option
        .setName("reason")
        .setDescription("The reason for the mute.")
        .setRequired(false)
    )
    .setDMPermission(false),
  async execute(interaction) {
    // Get options
    const memberToMute = await interaction.guild.members
      .fetch(interaction.options.getUser("user").id)
      .catch(() => {});
    const time = interaction.options.getString("time");
    const reason = interaction.options.getString("reason") || `Not provided.`;

    // Get form db
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
    if (memberToMute) {
      if (
        interaction.member.roles.highest.position <=
        memberToMute.roles.highest.position
      )
        return interaction.reply({
          ephemeral: true,
          content: "You don’t have sufficient permissions to ban this user.",
        });
      if (
        interaction.guild.members.me.roles.highest.position <=
        memberToMute.roles.highest.position
      )
        return interaction.reply({
          ephemeral: true,
          content: "I don’t have sufficient permissions to ban this user.",
        });
      if (memberToMute.user.id === interaction.user.id)
        return interaction.reply({
          ephemeral: true,
          content: "You can't mute yourself.",
        });
      if (memberToMute.user.id === interaction.guild.ownerId)
        return interaction.reply({
          ephemeral: true,
          content: "You can’t mute the owner.",
        });
    } else {
      return interaction.reply({
        ephemeral: true,
        content: "This user isn't on the server.",
      });
    }

    // Errors
    const punishmentsCollection = new model("punishments", PunishmentSchema);
    const searchPunishment = await punishmentsCollection.findOne({
      guildId: interaction.guild.id,
      userId: memberToMute
        ? memberToMute.user.id
        : interaction.options.getUser("user").id,
      type: PunishmentType.Mute,
    });
    if (searchPunishment)
      return interaction.reply({
        ephemeral: true,
        content: "This user is already muted.",
      });

    if (time && !/^(\d+d)?(\d+h)?(\d+m)?(\d+s)?$/.test(time))
      return interaction.reply({
        ephemeral: true,
        content:
          "The time option is not formatted properly, it must be formatted as 5d(days) 3h(hours) 1m(minutes).",
      });

    // Ban
    const muteTime = time ? Date.now() + ms(time) : false;
    await memberToMute.roles.add(setting.data.muteRole).catch(() => {});

    const muteEmbed = new EmbedBuilder()
      .setColor(Colors.DarkRed)
      .setTitle("Mute")
      .setDescription(
        `Sucssessfully muted ${
          memberToMute ? memberToMute.user : interaction.options.getUser("user")
        }.\n\n**Mute Info:**\n> User: ${
          memberToMute ? memberToMute.user : interaction.options.getUser("user")
        }\n> Muted by: ${
          interaction.member
        }\n> Reason: \`${reason}\`\n> Muted at: <t:${parseInt(
          Date.now() / 1000
        )}:d> <t:${parseInt(Date.now() / 1000)}:t>\n> Muted end: ${
          !time
            ? "**`Permanent`**"
            : `<t:${parseInt(muteTime / 1000)}:d> <t:${parseInt(
                muteTime / 1000
              )}:t>`
        }`
      )
      .setTimestamp()
      .setFooter({ text: interaction.guild.name });

    await interaction.reply({ ephemeral: true, embeds: [muteEmbed] });
    await sendLog(muteEmbed, interaction);
    if (memberToMute) await memberToMute.send({ embeds: [muteEmbed] });
    else
      await interaction.options.getUser("user").send({ embeds: [muteEmbed] });

    // Schedule
    if (time)
      scheduleJob(new Date(muteTime), async () => {
        await memberToMute.roles.remove(setting.data.muteRole).catch(() => {});
        await punishmentsCollection.deleteOne({
          guildId: interaction.guild.id,
          userId: interaction.options.getUser("user").id,
          type: PunishmentType.Mute,
        });
      });

    // Save in DB
    const data = new punishmentsCollection({
      guildId: interaction.guild.id,
      userId: memberToMute
        ? memberToMute.user.id
        : interaction.options.getUser("user").id,
      type: PunishmentType.Mute,
      banned: {
        by: interaction.user.id,
        at: Date.now(),
      },
      end: muteTime,
      reason,
    });
    data.save();
  },
};
