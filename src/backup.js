const dayjs = require('dayjs');
const slack = require('./slack');
const envHelper = require('./env-helper');
const { S3, Credentials } = require('aws-sdk');
const stringHelper = require('./string-helper');
const cleanupRunner = require('./cleanup-runner');
const s3BackupRunner = require('./s3-backup-runner');
const mongoDbBackupRunner = require('./mongodb-backup-runner');

module.exports.backup = async () => {

  const env = envHelper.getForBackup();

  const s3 = new S3({
    apiVersion: '2006-03-01',
    endpoint: env.s3Endpoint,
    region: env.s3Region,
    credentials: new Credentials(env.s3AccessKey, env.s3SecretKey)
  });

  const backupBucketFolder = dayjs().format('YYYYMMDD_HHmmss');

  const slackClient = slack.getClient(env.slackWebhookUrl, env.projectName);

  const runMongoDbBackup = async () => {
    let databaseName;

    try {
      databaseName = stringHelper.getDatabaseNameFromUri(env.mongoDbUri);

      await mongoDbBackupRunner.run({
        s3,
        mongoDbUri: env.mongoDbUri,
        databaseName,
        backupBucketName: env.backupBucketName,
        backupBucketFolder
      });
    } catch (error) {
      console.log('Failed to back up mongoDB', error);
      await slackClient.notify(`Failed to back up mongoDB _${databaseName}_`, error);
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
      console.log('Failed to back up mongoDB S3 bucket', error);
      await slackClient.notify(`Failed to back up S3 bucket _${env.bucketName}_`, error);
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

  let success = await runMongoDbBackup();
  success = await runS3Backup() && success;

  if (success) {
    await runCleanup();
    await slackClient.notify(`Created backup _${backupBucketFolder}_ in S3 bucket _${env.backupBucketName}_`);
  }
};
