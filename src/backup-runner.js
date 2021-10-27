const dayjs = require('dayjs');
const envHelper = require('./env-helper');
const { S3, Credentials } = require('aws-sdk');
const s3BackupRunner = require('./s3-backup-runner');
const mongoDbBackupRunner = require('./mongodb-backup-runner');

const env = envHelper.get();

const s3 = new S3({
  apiVersion: '2006-03-01',
  endpoint: env.s3Endpoint,
  region: env.s3Region,
  credentials: new Credentials(env.s3AccessKey, env.s3SecretKey)
});
const destinationBucketFolder = dayjs().format(env.dateFormat);

(async () => {
  await mongoDbBackupRunner.run({
    s3,
    mongoDbUri: env.mongoDbUri,
    destinationBucketName: env.destinationBucketName,
    destinationBucketFolder
  });

  await s3BackupRunner.run({
    s3,
    sourceBucketName: env.sourceBucketName,
    destinationBucketName: env.destinationBucketName,
    destinationBucketFolder
  });
})();
