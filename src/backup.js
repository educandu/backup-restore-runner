import dayjs from 'dayjs';
import slack from './slack.js';
import envHelper from './env-helper.js';
import stringHelper from './string-helper.js';
import cleanupRunner from './cleanup-runner.js';
import { createS3Client } from './s3-helper.js';
import s3BackupRunner from './s3-backup-runner.js';
import mongoDbBackupRunner from './mongodb-backup-runner.js';

export async function backup() {

  const env = envHelper.getForBackup();

  const s3 = createS3Client({
    endpoint: env.s3Endpoint,
    region: env.s3Region,
    accessKey: env.s3AccessKey,
    secretKey: env.s3SecretKey
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
}
