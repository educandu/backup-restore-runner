const fs = require('fs');
const { promisify } = require('util');
const s3Helper = require('./s3-helper');
const exec = promisify(require('child_process').exec);

function getLastPartInPath(path) {
  const parts = path.split('/');
  return parts.pop();
}

module.exports.run = async ({ s3, bucketName, objectKey, mongoDbUri }) => {
  try {
    const databaseName = getLastPartInPath(mongoDbUri);
    const fileName = getLastPartInPath(objectKey);

    console.log(`Starting to restore mongoDB backup '${objectKey}' from S3 bucket '${bucketName}' to '${databaseName}' database`);

    const fileWriteStream = fs.createWriteStream(fileName);

    await s3Helper.downloadZipFile({ s3, bucketName, objectKey, fileWriteStream });
    console.log(`Downloaded file ${fileName}`);

    fileWriteStream.end();

    await exec(`mongorestore --drop --uri "${mongoDbUri}" --db "${databaseName}" --archive "${fileName}" --dryRun`);

    console.log('Finished running mongoDb restore');

  } catch (error) {
    console.log('Error restoring mongoDB from S3 bucket: ', error);
  }
};
