const { model } = require("mongoose");
const SettingSchema = require("../Schemas/SettingSchema");
const { SettingType } = require("./Enum");

const sendLog = async (embed, interaction) => {
  // Get setting
  const settingsCollection = new model("settings", SettingSchema);
  const setting = await settingsCollection.findOne({
    guildId: interaction.guild.id,
    type: SettingType.Moderation,
  });
  if (!setting || (setting && !setting.data.logChannel)) return;

  // Get channel
  const channel = await interaction.guild.channels
    .fetch(setting.data.logChannel)
    .catch(() => {});
  if (!channel) return;
  const message = await channel.send({ embeds: [embed] });

  return { channelId: channel.id, messageId: message.id };
};

module.exports = sendLog;
