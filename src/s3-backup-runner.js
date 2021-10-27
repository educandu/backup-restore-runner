const s3Helper = require('./s3-helper');

module.exports.run = async ({ s3, bucketName, backupBucketName, backupBucketFolder }) => {
  console.log(`Starting S3 backup of bucket '${bucketName}' into bucket '${backupBucketName} under folder ${backupBucketName}'`);

  try {
    const sourceObjects = await s3Helper.listAllObjects({ s3, bucketName });
    for (const obj of sourceObjects) {
      console.log(`Copying object ${obj.Key}`);
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
  } catch (error) {
    console.log('Error during S3 backup: ', error);
  }
};
