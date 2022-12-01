const ensureEnv = name => {
  const result = process.env[name];
  if (!result) {
    throw new Error(`Environment variable ${name} is missing or empty!`);
  }
  return result;
};

const getCommonVariables = () => {
  return {
    s3Endpoint: ensureEnv('S3_ENDPOINT'),
    s3Region: ensureEnv('S3_REGION'),
    s3AccessKey: ensureEnv('S3_ACCESS_KEY'),
    s3SecretKey: ensureEnv('S3_SECRET_KEY'),
    bucketName: ensureEnv('S3_BUCKET'),
    backupBucketName: ensureEnv('S3_BACKUP_BUCKET'),
    mongoDbUri: ensureEnv('MONGODB_URI'),
    projectName: process.env.PROJECT_NAME,
    slackWebhookUrl: process.env.SLACK_WEBHOOK_URL
  };
};

const ensureSanitizedS3ObjectKeysPrefix = () => {
  let value = ensureEnv('S3_OBJECT_KEYS_PREFIX');

  if (value.startsWith('/')) {
    value = value.replace('/', '');
  }
  if (!value.endsWith('/')) {
    value = `${value}/`;
  }
  return value;
};

function getForBackup() {
  return {
    ...getCommonVariables(),
    maxBackupCount: process.env.MAX_BACKUP_COUNT || 5
  };
}

function getForRestore() {
  return {
    ...getCommonVariables(),
    mongoDbObjectKey: ensureEnv('MONGODB_OBJECT_KEY'),
    s3ObjectKeysPrefix: ensureSanitizedS3ObjectKeysPrefix()
  };
}


export default {
  getForBackup,
  getForRestore
}
