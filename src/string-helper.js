import { ConnectionString } from 'connection-string';

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

export default {
  getFileNameFromPath,
  getDatabaseNameFromUri,
  getFolderNameFromS3Object
};
