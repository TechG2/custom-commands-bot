const mongoose = require("mongoose");
require("dotenv").config();

module.exports = {
  async execute() {
    mongoose
      .connect(process.env.MONGO_DB)
      .then(() => console.log("Connected to the databese"))
      .catch((err) => console.log(err));
  },
};
