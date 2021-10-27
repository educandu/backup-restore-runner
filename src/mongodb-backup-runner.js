const fs = require('fs');
const archiver = require('archiver');
const { promisify } = require('util');
const s3Helper = require('./s3-helper');
const exec = promisify(require('child_process').exec);

function getDatabaseName (mongoDbUri) {
  const parts = mongoDbUri.split('/');
  return parts.pop();
}

module.exports.run = async ({ s3, mongoDbUri, destinationBucketName, destinationBucketFolder }) => {
  const fileName = getDatabaseName(mongoDbUri);
  const fileNameWithExtension = `${fileName}.zip`;
  const folderName = `/tmp/${fileName}/`;
  const filePath = `/tmp/${fileNameWithExtension}`;
  const s3Key = `${destinationBucketFolder}/${fileNameWithExtension}`;

  console.log(`Starting backup of mongoDB '${fileName}'' into S3 bucket '${destinationBucketName}' under folder '${destinationBucketFolder}'`);

  try {
    await exec(`mongodump --uri "${mongoDbUri}" --out "${folderName}"`);

    const output = fs.createWriteStream(filePath);
    const zipArchive = archiver('zip');

    zipArchive.on('warning', (err) => {
      console.log('Warning creating ZIP archive: ', err);
    })

    zipArchive.on('error', (err) => {
      console.log('Error creating ZIP archive: ', err);
      return;
    });

    output.on('close', () => {
      fs.readFile(filePath, async (fsError, data) => {
        if (fsError) {
          console.log(`Error reading file '${filePath}'': `, fsError);
          return;
        }

        try {
          await s3Helper.uploadZipFile({ s3, bucketName: destinationBucketName, key: s3Key, data });
          console.log(`Succesfully uploaded file '${fileNameWithExtension}' to S3 bucket '${destinationBucketName}'`)
        } catch (s3Error) {
          console.log(`Error uploading file '${fileNameWithExtension}' to S3 bucket '${destinationBucketName}': `, s3Error);
        }
      });
    });

    zipArchive.pipe(output);
    zipArchive.directory(folderName, false);
    zipArchive.finalize();

    console.log('Finished running mongoDB backup.');
  } catch (error) {
    console.log(`Error backing up mongoDB to S3 bucket '${destinationBucketName}': `, error);
  }
};
