const dayjs = require('dayjs');
const envHelper = require('./env-helper');
const { S3, Credentials } = require('aws-sdk');
const cleanupRunner = require('./cleanup-runner');
const s3BackupRunner = require('./s3-backup-runner');
const mongoDbBackupRunner = require('./mongodb-backup-runner');

const env = envHelper.getForBackup();

const s3 = new S3({
  apiVersion: '2006-03-01',
  endpoint: env.s3Endpoint,
  region: env.s3Region,
  credentials: new Credentials(env.s3AccessKey, env.s3SecretKey)
});
const backupBucketFolder = dayjs().format('YYYYMMDD_HHmmss');

(async () => {
  await mongoDbBackupRunner.run({
    s3,
    mongoDbUri: env.mongoDbUri,
    backupBucketName: env.backupBucketName,
    backupBucketFolder
  });

  await s3BackupRunner.run({
    s3,
    bucketName: env.bucketName,
    backupBucketName: env.backupBucketName,
    backupBucketFolder
  });

  await cleanupRunner.run({
    s3,
    backupBucketName: env.backupBucketName,
    maxBackupCount: env.maxBackupCount
  });
})();
