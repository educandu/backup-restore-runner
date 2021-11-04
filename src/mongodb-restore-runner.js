const fs = require('fs');
const exec = require('child_process').exec;
const stringHelper = require('./string-helper');

module.exports.run = ({ s3, bucketName, objectKey, mongoDbUri, databaseName }) => {
  const zipFileName = stringHelper.getFileNameFromPath(objectKey);
  const unzipFolder = './temp';

  console.log(`Starting mongoDB restore backup '${objectKey}' from S3 bucket '${bucketName}' to '${databaseName}' database`);

  return new Promise((resolve, reject) => {
    const fileWriteStream = fs.createWriteStream(zipFileName);

    const s3Stream = s3.getObject({ Bucket: bucketName, Key: objectKey }).createReadStream();
    s3Stream.on('error', s3Error => reject(s3Error));

    s3Stream.pipe(fileWriteStream)
      .on('error', s3Error => reject(s3Error))
      .on('close', () => {
        console.log(`Downloaded file '${zipFileName}'`);

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
  });
};
