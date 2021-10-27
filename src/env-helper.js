function ensureEnv (name) {
  const result = process.env[name];
  if (!result) {
    throw new Error(`Environment variable ${name} is missing or empty!`);
  }
  return result;
}

module.exports.get = () => {
  return {
    s3Endpoint: ensureEnv('S3_ENDPOINT'),
    s3Region: ensureEnv('S3_REGION'),
    s3AccessKey: ensureEnv('S3_ACCESS_KEY'),
    s3SecretKey: ensureEnv('S3_SECRET_KEY'),
    sourceBucketName: ensureEnv('S3_SOURCE_BUCKET'),
    destinationBucketName: ensureEnv('S3_DESTINATION_BUCKET'),
    mongoDbUri: ensureEnv('MONGODB_URI'),
    dateFormat: process.env.DATE_FORMAT || 'YYYYMMDD_HHmmss',
  };
}
