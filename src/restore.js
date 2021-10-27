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
  await mongoDbRestoreRunner.run({
    s3,
    bucketName: env.backupBucketName,
    objectKey: env.mongoDbObjectKey,
    mongoDbUri: env.mongoDbUri
  });

  await s3RestoreRunner.run({
    s3,
    bucketName: env.bucketName,
    backupBucketName: env.backupBucketName,
    keysPrefix: env.s3ObjectKeysPrefix
  });
})();
