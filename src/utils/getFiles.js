const fs = require("node:fs");
const path = require("node:path");

function getFiles(folderPath, folder = false) {
  const foudFiles = fs.readdirSync(folderPath);
  const files = [];

  foudFiles.forEach((file) => {
    const fullPath = path.join(folderPath, file);

    if (folder) {
      if (fs.lstatSync(fullPath).isDirectory()) files.push(fullPath);
    } else {
      if (fs.lstatSync(fullPath).isFile()) files.push(fullPath);
    }
  });

  return files;
}

module.exports = getFiles;
