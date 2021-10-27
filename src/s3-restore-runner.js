const s3Helper = require('./s3-helper');

module.exports.run = async ({ s3, bucketName, backupBucketName, s3ObjectKeysPrefix }) => {
  console.log(`Starting S3 restore of backup '${s3ObjectKeysPrefix}' from bucket '${backupBucketName} into bucket ${bucketName}`);

  try {
    const currentBucketObjects = await s3Helper.listAllObjects({ s3, bucketName });
    for (const obj of currentBucketObjects) {
      console.log(`Deleting object ${obj.Key}`);
      /* eslint-disable no-await-in-loop */
      await s3Helper.deleteObject({ s3, bucketName, key: obj.Key });
    }

    const backupBucketObjects = await s3Helper.listAllObjects({ s3, bucketName: backupBucketName });
    for (const obj of backupBucketObjects) {
      console.log(`Copying object ${obj.Key}`);
      const sourceKey = obj.Key;
      const destinationKey = obj.Key.replace(s3ObjectKeysPrefix, '');

      /* eslint-disable no-await-in-loop */
      await s3Helper.copyObject({
        s3,
        sourceBucketName: backupBucketName,
        sourceKey,
        destinationBucketName: bucketName,
        destinationKey
      });
    }

    console.log('Finished S3 backup.');
  } catch (error) {
    console.log('Error during S3 backup: ', error);
  }
};
