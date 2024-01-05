const {
  SlashCommandBuilder,
  PermissionsBitField,
  ChannelType,
} = require("discord.js");
const { model } = require("mongoose");
const SettingSchema = require("../Schemas/SettingSchema");
const { SettingType } = require("../utils/Enum");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("moderation-setup")
    .setDescription("This command changes the moderation settings of a server.")
    .addRoleOption((option) =>
      option
        .setName("mute-role")
        .setDescription("The role to be added when a player is muted.")
        .setRequired(false)
    )
    .addRoleOption((option) =>
      option
        .setName("staff-role")
        .setDescription("The role that can use moderation commands.")
        .setRequired(false)
    )
    .addChannelOption((option) =>
      option
        .setName("log-channel")
        .setDescription(
          "The channel where logs of bans, mute etc... will be sent."
        )
        .addChannelTypes(ChannelType.GuildText)
        .setRequired(false)
    )
    .setDefaultMemberPermissions(PermissionsBitField.Flags.Administrator)
    .setDMPermission(false),
  async execute(interaction) {
    // Slash options + search
    const muteRole = interaction.options.getRole("mute-role");
    const staffRole = interaction.options.getRole("staff-role");
    const logChannel = interaction.options.getChannel("log-channel");

    // Errors
    if (!muteRole && !staffRole && !logChannel)
      return interaction.reply({
        ephemeral: true,
        content: "Select at least one option to modify.",
      });

    for (const role of [muteRole, staffRole]) {
      // Role errors
      if (role && role.id === interaction.guild.roles.everyone.id)
        return interaction.reply({
          ephemeral: true,
          content: "Select a valid role.",
        });
      else if (
        role &&
        interaction.guild.members.me.roles.highest.position <= role.position
      )
        return interaction.reply({
          ephemeral: true,
          content: "I don't have sufficent permissions for use this role.",
        });
    }

    // Save in db
    const settingsCollection = new model("settings", SettingSchema);

    if (muteRole) {
      await settingsCollection.updateOne(
        { guildId: interaction.guild.id, type: SettingType.Moderation },
        {
          $set: {
            "data.muteRole": muteRole.id,
            type: SettingType.Moderation,
            guildId: interaction.guild.id,
          },
        },
        { upsert: true }
      );
    }
    if (staffRole)
      await settingsCollection.updateOne(
        { guildId: interaction.guild.id, type: SettingType.Moderation },
        {
          $set: {
            "data.staffRole": staffRole.id,
            type: SettingType.Moderation,
            guildId: interaction.guild.id,
          },
        },
        { upsert: true }
      );
    if (logChannel)
      await settingsCollection.updateOne(
        { guildId: interaction.guild.id, type: SettingType.Moderation },
        {
          $set: {
            "data.logChannel": logChannel.id,
            type: SettingType.Moderation,
            guildId: interaction.guild.id,
          },
        },
        { upsert: true }
      );

    // Output
    await interaction.reply({
      ephemeral: true,
      content: "Sucssessfully set the moderation settings.",
    });
  },
};
