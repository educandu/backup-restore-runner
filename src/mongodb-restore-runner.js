import fs from 'node:fs';
import s3Helper from './s3-helper.js';
import { exec } from 'node:child_process';
import stringHelper from './string-helper.js';

async function run({ s3, bucketName, objectKey, mongoDbUri, databaseName }) {
  const zipFileName = stringHelper.getFileNameFromPath(objectKey);
  const unzipFolder = './temp';

  console.log(`Starting mongoDB restore backup '${objectKey}' from S3 bucket '${bucketName}' to '${databaseName}' database`);

  await s3Helper.downloadObject({ s3, bucketName, key: objectKey, fileName: zipFileName });
  console.log(`Downloaded file '${zipFileName}'`);

  fs.mkdirSync(unzipFolder);

  await new Promise((resolve, reject) => {
    exec(`unzip ${zipFileName} -d ${unzipFolder}`, (unzipError, unzipStdOut) => {
      if (unzipError) {
        console.log(`Error unzipping ${zipFileName}`, unzipError);
        reject(unzipError);
      }

      console.log('Unzipping...');
      console.log(unzipStdOut);

      console.log('Running mongoDB restore...');
      exec(`mongorestore --drop --uri "${mongoDbUri}" --nsInclude "${databaseName}.*" --dir ${unzipFolder}`, restoreError => {
        if (restoreError) {
          console.log('Error restoring mongoDB from S3 bucket: ', restoreError);
          reject(restoreError);
        }
        console.log('Finished mongoDB restore');
        resolve();
      });
    });
  });
}

export default {
  run
};
