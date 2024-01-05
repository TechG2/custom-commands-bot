const { model } = require("mongoose");
const { scheduleJob } = require("node-schedule");
const PunishmentSchema = require("../../Schemas/PunishmentSchema");
const { PunishmentType, SettingType } = require("../../utils/Enum");
const SettingSchema = require("../../Schemas/SettingSchema");

const removePunishment = async (punishment, collection, client) => {
  const { guildId, userId, type, _id } = punishment;
  await collection.deleteOne({ _id: _id });

  // Remove Punishment
  const guild = await client.guilds.fetch(guildId).catch(() => {});
  if (!guild) return;

  if (type === PunishmentType.Ban)
    await guild.members.unban(userId).catch(() => {});
  else if (type === PunishmentType.Mute) {
    // Get mute role
    const settingsCollection = new model("settings", SettingSchema);
    const getRole = await settingsCollection.findOne({
      guildId,
      type: SettingType.Moderation,
    });
    if (!getRole) return;

    const member = await guild.members.fetch(userId).catch(() => {});
    if (!member) return;

    if (member.roles.cache.has(getRole.data.muteRole))
      await member.roles.remove(getRole.data.muteRole).catch(() => {});
  }
};

module.exports = {
  async execute(client) {
    // Get/Remove punishments
    const punishmentsCollection = new model("punishments", PunishmentSchema);
    const punishments = await punishmentsCollection.find();

    for (const punishment of punishments) {
      const { end } = punishment;
      if (!end) return;
      const timeRemaining = end - Date.now();

      if (timeRemaining < 0)
        return removePunishment(punishment, punishmentsCollection, client);
      else
        scheduleJob(new Date(end), async () =>
          removePunishment(punishment, punishmentsCollection, client)
        );
    }
  },
};
