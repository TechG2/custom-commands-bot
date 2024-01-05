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
    .setName("ban")
    .setDescription("This command bans a user from the server.")
    .addUserOption((option) =>
      option
        .setName("user")
        .setDescription("The user to be ban.")
        .setRequired(true)
    )
    .addStringOption((option) =>
      option
        .setName("time")
        .setDescription("The duration of the ban.")
        .setRequired(false)
    )
    .addStringOption((option) =>
      option
        .setName("reason")
        .setDescription("The reason for the ban.")
        .setRequired(false)
    )
    .setDMPermission(false),
  async execute(interaction) {
    // Get options
    const memberToBan = await interaction.guild.members
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
    if (memberToBan) {
      if (
        interaction.member.roles.highest.position <=
        memberToBan.roles.highest.position
      )
        return interaction.reply({
          ephemeral: true,
          content: "You don’t have sufficient permissions to ban this user.",
        });
      if (
        interaction.guild.members.me.roles.highest.position <=
        memberToBan.roles.highest.position
      )
        return interaction.reply({
          ephemeral: true,
          content: "I don’t have sufficient permissions to ban this user.",
        });
      if (memberToBan.user.id === interaction.user.id)
        return interaction.reply({
          ephemeral: true,
          content: "You can't ban yourself.",
        });
      if (memberToBan.user.id === interaction.guild.ownerId)
        return interaction.reply({
          ephemeral: true,
          content: "You can’t ban the owner.",
        });
    }

    // Errors
    const punishmentsCollection = new model("punishments", PunishmentSchema);
    const searchPunishment = await punishmentsCollection.findOne({
      guildId: interaction.guild.id,
      userId: memberToBan
        ? memberToBan.user.id
        : interaction.options.getUser("user").id,
      type: PunishmentType.Ban,
    });
    if (searchPunishment)
      return interaction.reply({
        ephemeral: true,
        content: "This user is already banned.",
      });

    if (time && !/^(\d+d)?(\d+h)?(\d+m)?(\d+s)?$/.test(time))
      return interaction.reply({
        ephemeral: true,
        content:
          "The time option is not formatted properly, it must be formatted as 5d(days) 3h(hours) 1m(minutes)",
      });

    // Ban
    const banTime = time ? Date.now() + ms(time) : false;
    await interaction.guild.members
      .ban(
        memberToBan
          ? memberToBan.user.id
          : interaction.options.getUser("user").id
      )
      .catch(() => {});

    const banEmbed = new EmbedBuilder()
      .setColor(Colors.DarkRed)
      .setTitle("Ban")
      .setDescription(
        `Sucssessfully banned ${
          memberToBan ? memberToBan.user : interaction.options.getUser("user")
        }.\n\n**Ban Info:**\n> User: ${
          memberToBan ? memberToBan.user : interaction.options.getUser("user")
        }\n> Banned by: ${
          interaction.member
        }\n> Reason: \`${reason}\`\n> Banned at: <t:${parseInt(
          Date.now() / 1000
        )}:d> <t:${parseInt(Date.now() / 1000)}:t>\n> Ban end: ${
          !time
            ? "**`Permanent`**"
            : `<t:${parseInt(banTime / 1000)}:d> <t:${parseInt(
                banTime / 1000
              )}:t>`
        }`
      )
      .setTimestamp()
      .setFooter({ text: interaction.guild.name });

    await interaction.reply({ ephemeral: true, embeds: [banEmbed] });
    await sendLog(banEmbed, interaction);
    if (memberToBan) await memberToBan.send({ embeds: [banEmbed] });
    else await interaction.options.getUser("user").send({ embeds: [banEmbed] });

    // Schedule
    if (time)
      scheduleJob(new Date(banTime), async () => {
        interaction.guild.members.unban(
          memberToBan
            ? memberToBan.user.id
            : interaction.options.getUser("user").id
        );
        await punishmentsCollection.deleteOne({
          guildId: interaction.guild.id,
          userId: interaction.options.getUser("user").id,
          type: PunishmentType.Ban,
        });
      });

    // Save in DB
    const data = new punishmentsCollection({
      guildId: interaction.guild.id,
      userId: memberToBan
        ? memberToBan.user.id
        : interaction.options.getUser("user").id,
      type: PunishmentType.Ban,
      banned: {
        by: interaction.user.id,
        at: Date.now(),
      },
      end: banTime,
      reason,
    });
    data.save();
  },
};
