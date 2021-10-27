function listNext1000Objects({ s3, bucketName, keysPrefix, continuationToken }) {
  const params = {
    Bucket: bucketName,
    Prefix: keysPrefix,
    MaxKeys: 1000,
    ContinuationToken: continuationToken
  };

  return new Promise((resolve, reject) => {
    s3.listObjectsV2(params, (err, data) => err ? reject(err) : resolve(data));
  });
}

async function listAllObjects({ s3, bucketName, keysPrefix }) {
  let result = [];
  let continuationToken = null;

  do {
    /* eslint-disable no-await-in-loop */
    const currentResult = await listNext1000Objects({ s3, bucketName, keysPrefix, continuationToken });
    if (currentResult.Contents.length) {
      result = result.concat(currentResult.Contents);
      continuationToken = currentResult.NextContinuationToken || null;
    } else {
      continuationToken = null;
    }
  } while (continuationToken);

  return result;
}

function copyObject({ s3, sourceBucketName, sourceKey, destinationBucketName, destinationKey }) {
  const params = {
    Bucket: destinationBucketName,
    CopySource: `/${sourceBucketName}/${encodeURIComponent(sourceKey)}`,
    Key: destinationKey
  };

  return new Promise((resolve, reject) => {
    s3.copyObject(params, (err, data) => err ? reject(err) : resolve(data));
  });
}

function deleteObject({ s3, bucketName, key }) {
  const params = {
    Bucket: bucketName,
    Key: key
  };

  return new Promise((resolve, reject) => {
    s3.deleteObject(params, (err, data) => err ? reject(err) : resolve(data));
  });
}

function downloadZipFile({ s3, bucketName, objectKey, fileWriteStream }) {
  const params = {
    Bucket: bucketName,
    Key: objectKey
  };
  const s3Stream = s3.getObject(params).createReadStream();

  return new Promise((resolve, reject) => {
    s3Stream.on('error', error => reject(error));

    s3Stream.pipe(fileWriteStream).on('error', error => {
      reject(error);
    }).on('close', () => resolve());
  });
}

function uploadZipFile({ s3, bucketName, key, data }) {
  const params = {
    Bucket: bucketName,
    Key: key,
    Body: data,
    ContentType: 'application/zip',
    ServerSideEncryption: 'AES256',
    StorageClass: 'STANDARD'
  };
  return new Promise((resolve, reject) => {
    s3.upload(params, (err, uploadData) => err ? reject(err) : resolve(uploadData));
  });
}

module.exports = {
  listAllObjects,
  copyObject,
  deleteObject,
  uploadZipFile,
  downloadZipFile
};
