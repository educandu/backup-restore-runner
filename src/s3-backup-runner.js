const s3Helper = require('./s3-helper');

module.exports.run = async ({ s3, sourceBucketName, destinationBucketName, destinationBucketFolder }) => {
  console.log(`Starting S3 backup of bucket '${sourceBucketName}' into bucket '${destinationBucketName} under folder ${destinationBucketName}'`);

  try {
    const sourceObjects = await s3Helper.listAllObjects(s3, sourceBucketName);
    for (const obj of sourceObjects) {
      console.log(`Copying object ${obj.Key}`);
      const sourceKey = obj.Key;
      const destinationKey = `${destinationBucketFolder}/${sourceBucketName}/${obj.Key}`;
      await s3Helper.copyObject({ s3, sourceBucketName, sourceKey, destinationBucketName, destinationKey });
    }

    console.log('Finished S3 backup.');
  } catch (error) {
    console.log(`Error during S3 backup: `, error);
  }
};
