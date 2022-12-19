import s3Helper from './s3-helper.js';

async function run({ s3, bucketName, backupBucketName, backupBucketFolder }) {
  console.log(`Starting S3 backup of bucket '${bucketName}' into bucket '${backupBucketName}' under folder '${backupBucketFolder}'`);

  const sourceObjects = await s3Helper.listAllObjects({ s3, bucketName });
  for (const sourceObject of sourceObjects) {
    const sourceKey = sourceObject.Key;
    const destinationKey = `${backupBucketFolder}/${bucketName}/${sourceKey}`;

    await s3Helper.copyObject({
      s3,
      sourceBucketName: bucketName,
      sourceKey,
      destinationBucketName: backupBucketName,
      destinationKey,
      ensureContentType: true
    });
  }

  console.log('Finished S3 backup.');
}

export default {
  run
};
