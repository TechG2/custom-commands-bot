const getFiles = require("../utils/getFiles");
const path = require("node:path");

function eventsHandler(client) {
  const eventsDir = getFiles(path.join(__dirname, "..", "events"), true);

  eventsDir.forEach((event) => {
    const eventName = event.split("\\").pop();
    const eventsFiles = getFiles(event);

    eventsFiles.forEach((file) => {
      client.on(eventName, (args) => {
        const eventExecute = require(file);

        eventExecute.execute(args, client);
      });
    });
  });
}

module.exports = eventsHandler;
