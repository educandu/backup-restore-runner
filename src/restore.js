const slack = require('./slack');
const envHelper = require('./env-helper');
const { S3, Credentials } = require('aws-sdk');
const stringHelper = require('./string-helper');
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
  const slackClient = slack.getClient({ token: env.slackToken, channel: env.slackChannel });

  const runMongoDbRestore = async () => {
    try {
      await mongoDbRestoreRunner.run({
        s3,
        bucketName: env.backupBucketName,
        objectKey: env.mongoDbObjectKey,
        mongoDbUri: env.mongoDbUri
      });
    } catch (error) {
      const database = stringHelper.getDatabaseNameFromUri(env.mongoDbUri);
      slackClient.postMessage(`*Error* restoring mongoDB '${database}'`, error);
      console.log('MongodB restore was unsuccessfull. Error: ', error);
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
      console.log('S3 bucket restore was unsuccessfull. Error: ', error);
      slackClient.postMessage(`*Error* restoring S3 bucket '${env.bucketName}'`, error);
      return false;
    }
    return true;
  };

  let success = true;
  success = await runMongoDbRestore() && success;
  success = await runS3Restore() && success;

  if (success) {
    slackClient.postMessage(`Succesfully restored backups '${env.mongoDbObjectKey}' and '${env.s3ObjectKeysPrefix}'`);
  }
})();
