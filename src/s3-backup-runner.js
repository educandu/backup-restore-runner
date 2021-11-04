const s3Helper = require('./s3-helper');

module.exports.run = async ({ s3, bucketName, backupBucketName, backupBucketFolder }) => {
  console.log(`Starting S3 backup of bucket '${bucketName}' into bucket '${backupBucketName}' under folder '${backupBucketFolder}'`);

  const sourceObjects = await s3Helper.listAllObjects({ s3, bucketName });
  for (const obj of sourceObjects) {
    const sourceKey = obj.Key;
    const destinationKey = `${backupBucketFolder}/${bucketName}/${obj.Key}`;
    /* eslint-disable no-await-in-loop */
    await s3Helper.copyObject({
      s3,
      sourceBucketName: bucketName,
      sourceKey,
      destinationBucketName: backupBucketName,
      destinationKey
    });
  }

  console.log('Finished S3 backup.');
};
