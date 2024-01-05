const {
  SlashCommandBuilder,
  PermissionsBitField,
  TextInputBuilder,
  TextInputStyle,
  ActionRowBuilder,
  ModalBuilder,
} = require("discord.js");
const { model } = require("mongoose");
const SettingSchema = require("../Schemas/SettingSchema");
const { SettingType } = require("../utils/Enum");
const CommandSchema = require("../Schemas/CommandSchema");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("commands")
    .setDescription("This command handles custom commands.")
    .addSubcommand((subcommand) =>
      subcommand
        .setName("prefix")
        .setDescription("This sub-command modifies the commands prefix.")
        .addStringOption((option) =>
          option
            .setName("prefix")
            .setDescription("The prefix.")
            .setRequired(true)
        )
    )
    .addSubcommand((subcommand) =>
      subcommand
        .setName("add")
        .setDescription("This sub-command adds a custom command.")
        .addStringOption((option) =>
          option
            .setName("command-name")
            .setDescription("The name of the command to be added.")
            .setRequired(true)
        )
        .addBooleanOption((option) =>
          option
            .setName("embed")
            .setDescription("If the command should return an embed.")
            .setRequired(false)
        )
    )
    .addSubcommand((subcommand) =>
      subcommand
        .setName("delete")
        .setDescription("This sub-command deletes a custom command.")
        .addStringOption((option) =>
          option
            .setName("command-name")
            .setDescription("The name of the command to be removed.")
            .setRequired(true)
        )
    )
    .setDefaultMemberPermissions(PermissionsBitField.Flags.Administrator)
    .setDMPermission(false),
  async execute(interaction) {
    const subcommand = interaction.options.getSubcommand();

    if (subcommand === "prefix") {
      // Get options
      const prefix = interaction.options.getString("prefix");

      // Save in db
      const settingsCollection = new model("settings", SettingSchema);
      await settingsCollection.updateOne(
        { type: SettingType.CustomCommands, guildId: interaction.guild.id },
        {
          $set: {
            "data.prefix": prefix,
            type: SettingType.CustomCommands,
            guildId: interaction.guild.id,
          },
        },
        { upsert: true }
      );

      // Output
      await interaction.reply({
        ephemeral: true,
        content: `Successfully setted the prefix to \`${prefix}\`.`,
      });
    } else if (subcommand === "add") {
      // Get options
      const name = interaction.options.getString("command-name");
      const isEmbed = interaction.options.getBoolean("embed") || false;

      // Check db
      const commandsCollection = new model("commands", CommandSchema);
      let guildCommands = await commandsCollection.findOne({
        guildId: interaction.guild.id,
      });
      if (!guildCommands) {
        guildCommands = new commandsCollection({
          guildId: interaction.guild.id,
          commands: [],
        });
        guildCommands.save();
      }
      if (guildCommands.commands.some((command) => command.name === name))
        return interaction.reply({
          ephemeral: true,
          content: "There's already a command with that name.",
        });
      if (guildCommands.commands.length >= 10)
        return interaction.reply({
          ephemeral: true,
          content: "You can't create more than 10 commands.",
        });

      // Modal
      const messageInput = new TextInputBuilder()
        .setLabel("Message")
        .setPlaceholder("message...")
        .setMaxLength(500)
        .setStyle(TextInputStyle.Paragraph)
        .setCustomId("messageInput")
        .setRequired(true);
      if (isEmbed) messageInput.setRequired(false);

      const titleInput = new TextInputBuilder()
        .setLabel("Title")
        .setPlaceholder("title...")
        .setMaxLength(100)
        .setStyle(TextInputStyle.Short)
        .setCustomId("titleInput")
        .setRequired(true);
      const descriptionInput = new TextInputBuilder()
        .setLabel("Description")
        .setPlaceholder("description...")
        .setMaxLength(500)
        .setStyle(TextInputStyle.Paragraph)
        .setCustomId("descriptionInput")
        .setRequired(true);
      const imageInput = new TextInputBuilder()
        .setLabel("Image")
        .setPlaceholder("image...")
        .setMaxLength(100)
        .setStyle(TextInputStyle.Short)
        .setCustomId("imageInput")
        .setRequired(false);

      const messageRow = new ActionRowBuilder().setComponents(messageInput);
      const titleRow = new ActionRowBuilder().setComponents(titleInput);
      const descriptionRow = new ActionRowBuilder().setComponents(
        descriptionInput
      );
      const imageRow = new ActionRowBuilder().setComponents(imageInput);

      const commandModal = new ModalBuilder()
        .setTitle("Command")
        .setCustomId(`commandModal-${name}!-!${isEmbed}`)
        .setComponents(messageRow);
      if (isEmbed)
        commandModal.addComponents(titleRow, descriptionRow, imageRow);

      interaction.showModal(commandModal);
    } else if (subcommand === "delete") {
      // Get options
      const name = interaction.options.getString("command-name");

      // Check db
      const commandsCollection = new model("commands", CommandSchema);
      const guildCommands = await commandsCollection.findOne({
        guildId: interaction.guild.id,
      });
      if (!guildCommands) {
        return interaction.reply({
          ephemeral: true,
          content: "No command with that name.",
        });
      } else if (
        guildCommands &&
        !guildCommands.commands.some((command) => command.name === name)
      )
        return interaction.reply({
          ephemeral: true,
          content: "No command with that name.",
        });

      await commandsCollection.updateOne(
        { _id: guildCommands._id },
        { $pull: { commands: { name: name } } }
      );
      await interaction.reply({
        ephemeral: true,
        content: `Successfully deleted **${name}** command.`,
      });
    }
  },
};
