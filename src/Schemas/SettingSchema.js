const { Schema } = require("mongoose");

const SettingSchema = new Schema({
  guildId: {
    type: String,
    required: true,
  },
  type: {
    type: Number,
    required: true,
  },
  data: {
    type: Schema.Types.Mixed,
    required: true,
  },
});

module.exports = SettingSchema;
