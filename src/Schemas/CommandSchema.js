const { Schema } = require("mongoose");

const CommandSchema = new Schema({
  guildId: {
    type: String,
    required: true,
  },
  commands: {
    type: Array,
    required: true,
  },
});

module.exports = CommandSchema;
