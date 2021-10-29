const s3Helper = require('./s3-helper');
const stringHelper = require('./string-helper');

module.exports.run = async ({ s3, backupBucketName, maxBackupCount }) => {
  console.log(`Starting cleanup of the S3 bucket '${backupBucketName}' to reduce it to ${maxBackupCount} backups`);

  const backupObjects = await s3Helper.listAllObjects({ s3, bucketName: backupBucketName });
  const backupFolders = new Set(backupObjects.map(stringHelper.getFolderNameFromS3Object));
  const backupFoldersNewestToOldest = Array.from(backupFolders).sort().reverse();
  console.log(`Found backups: ${backupFoldersNewestToOldest}`);
  const backupFoldersToDelete = backupFoldersNewestToOldest.splice(maxBackupCount);

  if (backupFoldersToDelete.length) {
    console.log(`Deleting backups: ${backupFoldersToDelete}`);
  } else {
    console.log('There are no extra backups to remove.');
  }

  for (const obj of backupObjects) {
    const folderName = stringHelper.getFolderNameFromS3Object(obj);

    if (backupFoldersToDelete.includes(folderName)) {
      /* eslint-disable no-await-in-loop */
      await s3Helper.deleteObject({ s3, bucketName: backupBucketName, key: obj.Key });
    }
  }

  console.log('Finished cleaning up.');
};
