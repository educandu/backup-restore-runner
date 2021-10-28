const fs = require('fs');
const unzipper = require('unzipper');
const exec = require('child_process').exec;

function getLastPartInPath(path) {
  const parts = path.split('/');
  return parts.pop();
}

module.exports.run = ({ s3, bucketName, objectKey, mongoDbUri }) => {
  const databaseName = getLastPartInPath(mongoDbUri);
  const zipFileName = getLastPartInPath(objectKey);

  console.log(`Starting mongoDB restore backup '${objectKey}' from S3 bucket '${bucketName}' to '${databaseName}' database`);

  return new Promise((resolve, reject) => {
    const fileWriteStream = fs.createWriteStream(zipFileName);

    const params = {
      Bucket: bucketName,
      Key: objectKey
    };
    const s3Stream = s3.getObject(params).createReadStream();
    s3Stream.on('error', s3Error => reject(s3Error));

    s3Stream.pipe(fileWriteStream)
      .on('error', s3Error => reject(s3Error))
      .on('close', () => {
        if (fs.existsSync(zipFileName)) {
          console.log(`Downloaded file '${zipFileName}'`);
        }

        fs.createReadStream(zipFileName)
          /* eslint-disable new-cap */
          .pipe(unzipper.Extract({ path: '/temp' }))
          .on('error', unzipError => {
            console.log(`Error unzipping '${zipFileName}'`);
            reject(unzipError);
          });

        const getDirectories = source => fs.readdirSync(source, { withFileTypes: true })
          .map(dirent => dirent.name);

        console.log(getDirectories('.'));

        console.log('Running mongoDB restore...');
        exec(`mongorestore --drop --uri "${mongoDbUri}" --nsInclude "${databaseName}.*" --dir "/temp"`, execError => {
          if (execError) {
            console.log('Error restoring mongoDB from S3 bucket: ', execError);
            reject(execError);
          }
          console.log('Finished mongoDB restore');
          resolve();
        });
      });
  });
};
