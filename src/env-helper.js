function ensureEnv(name) {
  const result = process.env[name];
  if (!result) {
    throw new Error(`Environment variable ${name} is missing or empty!`);
  }
  return result;
}

const getCommonVariables = () => {
  return {
    s3Endpoint: ensureEnv('S3_ENDPOINT'),
    s3Region: ensureEnv('S3_REGION'),
    s3AccessKey: ensureEnv('S3_ACCESS_KEY'),
    s3SecretKey: ensureEnv('S3_SECRET_KEY'),
    bucketName: ensureEnv('S3_BUCKET'),
    backupBucketName: ensureEnv('S3_BACKUP_BUCKET'),
    mongoDbUri: ensureEnv('MONGODB_URI'),
    slackWebhookUrl: process.env.SLACK_WEBHOOK_URL
  };
};

exports.getForBackup = () => {
  return {
    ...getCommonVariables(),
    maxBackupCount: process.env.MAX_BACKUP_COUNT || 5
  };
};

exports.getForRestore = () => {
  return {
    ...getCommonVariables(),
    mongoDbObjectKey: ensureEnv('MONGODB_OBJECT_KEY'),
    s3ObjectKeysPrefix: ensureEnv('S3_OBJECT_KEYS_PREFIX')
  };
};
