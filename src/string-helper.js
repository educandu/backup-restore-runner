function getLastPartFromPath(path) {
  const parts = path.split('/');
  return parts.pop();
}

function getFolderNameFromS3Object(obj) {
  return obj.Key.split('/')[0];
}

module.exports = {
  getDatabaseNameFromUri: getLastPartFromPath,
  getFileNameFromPath: getLastPartFromPath,
  getFolderNameFromS3Object
};
