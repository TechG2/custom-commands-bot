module.exports = {
  async execute(interaction, client) {
    if (!interaction.isCommand()) return;

    const command = await interaction.client.commands.get(
      interaction.commandName
    );

    if (!command)
      return console.error(
        `The ${interaction.commandName} command doesn't exist.`
      );

    try {
      await command.execute(interaction, client);
    } catch (error) {
      console.error(error);
      await interaction.reply({
        content: "An error occurred while executing this command! ❌",
        ephemeral: true,
      });
    }
  },
};
