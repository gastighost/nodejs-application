const fs = require("fs");

function deleteFile(filePath) {
  fs.unlink(filePath, (error) => {
    if (error) {
      throw error;
    }
  });
}

exports.deleteFile = deleteFile;
