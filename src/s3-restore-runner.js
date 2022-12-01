import s3Helper from './s3-helper.js';

async function run({ s3, bucketName, backupBucketName, backupKeysPrefix }) {
  console.log(`Starting S3 restore of backup '${backupKeysPrefix}' from bucket '${backupBucketName}' into bucket '${bucketName}`);

  console.log(`Removing existing objects from bucket '${bucketName}'`);
  const currentBucketObjects = await s3Helper.listAllObjects({ s3, bucketName });
  for (const obj of currentBucketObjects) {
    /* eslint-disable no-await-in-loop */
    await s3Helper.deleteObject({ s3, bucketName, key: obj.Key });
  }

  console.log(`Restoring objects from bucket '${backupBucketName}'`);
  const backupBucketObjects = await s3Helper.listAllObjects({ s3, bucketName: backupBucketName, keysPrefix: backupKeysPrefix });
  for (const obj of backupBucketObjects) {
    const sourceKey = obj.Key;
    const destinationKey = obj.Key.replace(backupKeysPrefix, '');

    /* eslint-disable no-await-in-loop */
    await s3Helper.copyObject({
      s3,
      sourceBucketName: backupBucketName,
      sourceKey,
      destinationBucketName: bucketName,
      destinationKey
    });
  }

  console.log('Finished S3 restore.');
}

export default {
  run
}
