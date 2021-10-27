const s3Helper = require('./s3-helper');

function getFolderName(obj) {
  return obj.Key.split('/')[0];
}

module.exports.run = async ({ s3, backupBucketName, maxBackupCount }) => {
  try {
    console.log(`Starting cleanup of the S3 bucket '${backupBucketName}' to reduce it to ${maxBackupCount} backups`);

    const backupObjects = await s3Helper.listAllObjects({ s3, bucketName: backupBucketName });
    const backupFolders = new Set(...backupObjects.map(getFolderName));
    const backupFoldersOldestToNewest = Array.from(backupFolders).sort();
    const backupFoldersToDelete = backupFoldersOldestToNewest.slice(-maxBackupCount);

    for (const obj of backupObjects) {
      const folderName = getFolderName(obj);

      if (backupFoldersToDelete.includes(folderName)) {
        console.log(`Deleting object ${obj.Key}`);
        /* eslint-disable no-await-in-loop */
        await s3Helper.deleteObject({ s3, bucketName: backupBucketName, key: obj.Key });
      }
    }

    console.log('Finished cleaning up.');

  } catch (error) {
    console.log('Error cleaning up: ', error);
  }
};
