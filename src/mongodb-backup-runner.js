import fs from 'node:fs';
import archiver from 'archiver';
import s3Helper from './s3-helper.js';
import { promisify } from 'node:util';
import { exec } from 'node:child_process';

async function run({ s3, mongoDbUri, databaseName, backupBucketName, backupBucketFolder }) {
  const fileName = databaseName;
  const fileNameWithExtension = `${fileName}.zip`;
  const folderName = `/tmp/${fileName}/`;
  const filePath = `/tmp/${fileNameWithExtension}`;
  const s3Key = `${backupBucketFolder}/${fileNameWithExtension}`;

  console.log(`Starting backup of mongoDB '${fileName}' into S3 bucket '${backupBucketName}' under folder '${backupBucketFolder}'`);
  await promisify(exec)(`mongodump --uri "${mongoDbUri}" --out "${folderName}"`);

  await new Promise((resolve, reject) => {
    const output = fs.createWriteStream(filePath);

    const zipArchive = archiver('zip');

    zipArchive.on('warning', zipWarning => {
      console.log('Warning creating ZIP archive: ', zipWarning);
    });

    zipArchive.on('error', zipError => {
      console.log('Error creating ZIP archive: ', zipError);
      reject(zipError);
    });

    zipArchive.on('end', resolve);

    zipArchive.pipe(output);
    zipArchive.directory(folderName, false);
    zipArchive.finalize();
  });

  try {
    await s3Helper.uploadObject({ s3, bucketName: backupBucketName, key: s3Key, fileName: filePath });
    console.log(`Succesfully uploaded file '${fileNameWithExtension}' to S3 bucket '${backupBucketName}'`);
    console.log('Finished running mongoDB backup.');
  } catch (s3Error) {
    console.log(`Error uploading file '${fileNameWithExtension}' to S3 bucket '${backupBucketName}': `, s3Error);
    throw s3Error;
  }
}

export default {
  run
};
