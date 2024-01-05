const { Schema } = require("mongoose");

const PunishmentSchema = new Schema({
  guildId: {
    type: String,
    required: true,
  },
  userId: {
    type: String,
    required: true,
  },
  type: {
    type: Number,
    required: true,
  },
  reason: {
    type: String,
    required: true,
  },
  banned: {
    type: Schema.Types.Mixed,
    required: true,
  },
  end: {
    type: Schema.Types.Mixed,
    required: false,
  },
});

module.exports = PunishmentSchema;
