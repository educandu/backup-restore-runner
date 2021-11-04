const { ConnectionString } = require('connection-string');

function getFileNameFromPath(path) {
  const parts = path.split('/');
  return parts.pop();
}

function getDatabaseNameFromUri(uri) {
  if (!uri.trim()) {
    return '';
  }

  const result = new ConnectionString(uri);
  return (result.path || [])[0] || '';
}

function getFolderNameFromS3Object(obj) {
  return obj.Key.split('/')[0];
}

module.exports = {
  getFileNameFromPath,
  getDatabaseNameFromUri,
  getFolderNameFromS3Object
};
