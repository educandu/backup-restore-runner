const envHelper = require('./env-helper');
const { S3, Credentials } = require('aws-sdk');
const s3RestoreRunner = require('./s3-restore-runner');
const mongoDbRestoreRunner = require('./mongodb-restore-runner');

const env = envHelper.getForRestore();

const s3 = new S3({
  apiVersion: '2006-03-01',
  endpoint: env.s3Endpoint,
  region: env.s3Region,
  credentials: new Credentials(env.s3AccessKey, env.s3SecretKey)
});

(async () => {
  try {
    await mongoDbRestoreRunner.run({
      s3,
      bucketName: env.backupBucketName,
      objectKey: env.mongoDbObjectKey,
      mongoDbUri: env.mongoDbUri
    });
  } catch (error) {
    console.log('MongodB restore was unsuccessfull. Error: ', error);
  }

  try {
    await s3RestoreRunner.run({
      s3,
      bucketName: env.bucketName,
      backupBucketName: env.backupBucketName,
      backupKeysPrefix: env.s3ObjectKeysPrefix
    });
  } catch (error) {
    console.log('S3 bucket restore was unsuccessfull. Error: ', error);
  }
})();
