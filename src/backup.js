const dayjs = require('dayjs');
const slack = require('./slack');
const envHelper = require('./env-helper');
const { S3, Credentials } = require('aws-sdk');
const stringHelper = require('./string-helper');
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
  const slackClient = slack.getClient(env.slackWebhookUrl);

  const runMongoDbBackup = async () => {
    try {
      await mongoDbBackupRunner.run({
        s3,
        mongoDbUri: env.mongoDbUri,
        backupBucketName: env.backupBucketName,
        backupBucketFolder
      });
    } catch (error) {
      const database = stringHelper.getDatabaseNameFromUri(env.mongoDbUri);
      console.log('Failed to restore mongoDB', error);
      await slackClient.notify(`Failed to restore mongoDB _${database}_`, error);
      return false;
    }
    return true;
  };

  const runS3Backup = async () => {
    try {
      await s3BackupRunner.run({
        s3,
        bucketName: env.bucketName,
        backupBucketName: env.backupBucketName,
        backupBucketFolder
      });
    } catch (error) {
      console.log('Failed to restore mongoDB S3 bucket', error);
      await slackClient.notify(`Failed to restore S3 bucket _${env.bucketName}_`, error);
      return false;
    }
    return true;
  };

  const runCleanup = async () => {
    try {
      await cleanupRunner.run({
        s3,
        backupBucketName: env.backupBucketName,
        maxBackupCount: env.maxBackupCount
      });
    } catch (error) {
      console.log('Failed to clean up', error);
      await slackClient.notify(`Failed to clean up S3 bucket _${env.backupBucketName}_`, error);
      return false;
    }
    return true;
  };

  let success = true;
  success = await runMongoDbBackup() && success;
  success = await runS3Backup() && success;
  success = await runCleanup() && success;

  if (success) {
    await slackClient.notify(`Created backup _${backupBucketFolder}_ in S3 bucket _${env.backupBucketName}_`);
  }
})();
