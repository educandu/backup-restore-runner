const slack = require('./slack');
const envHelper = require('./env-helper');
const { S3, Credentials } = require('aws-sdk');
const stringHelper = require('./string-helper');
const s3RestoreRunner = require('./s3-restore-runner');
const mongoDbRestoreRunner = require('./mongodb-restore-runner');

module.exports.restore = async () => {

  const env = envHelper.getForRestore();

  const s3 = new S3({
    apiVersion: '2006-03-01',
    endpoint: env.s3Endpoint,
    region: env.s3Region,
    credentials: new Credentials(env.s3AccessKey, env.s3SecretKey)
  });

  const slackClient = slack.getClient(env.slackWebhookUrl, env.projectName);

  const runMongoDbRestore = async () => {
    let databaseName;

    try {
      databaseName = stringHelper.getDatabaseNameFromUri(env.mongoDbUri);

      await mongoDbRestoreRunner.run({
        s3,
        bucketName: env.backupBucketName,
        objectKey: env.mongoDbObjectKey,
        mongoDbUri: env.mongoDbUri,
        databaseName
      });
    } catch (error) {
      slackClient.notify(`Failed to restore mongoDB _${databaseName}_`, error);
      console.log('Failed to restore mongoDB', error);
      return false;
    }
    return true;
  };

  const runS3Restore = async () => {
    try {
      await s3RestoreRunner.run({
        s3,
        bucketName: env.bucketName,
        backupBucketName: env.backupBucketName,
        backupKeysPrefix: env.s3ObjectKeysPrefix
      });
    } catch (error) {
      console.log('Failed to restore S3 bucket', error);
      slackClient.notify(`Failed to restore S3 bucket _${env.bucketName}_`, error);
      return false;
    }
    return true;
  };

  let success = await runMongoDbRestore();
  success = await runS3Restore() && success;

  if (success) {
    slackClient.notify(`Restored backups _${env.mongoDbObjectKey}_ and _${env.s3ObjectKeysPrefix}_`);
  }
};
