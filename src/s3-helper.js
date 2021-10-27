async function listAllObjects (s3, bucketName) {
  let result = [];
  let continuationToken = null;

  do {
    const currentResult = await listNext1000Objects(s3, bucketName, continuationToken);
    if (currentResult.Contents.length) {
      result = result.concat(currentResult.Contents);
      continuationToken = currentResult.NextContinuationToken || null
    } else {
      continuationToken = null;
    }
  } while (!!continuationToken)

  return result;
}

function listNext1000Objects (s3, bucketName, continuationToken) {
  const params = {
    Bucket: bucketName,
    MaxKeys: 1000,
    ContinuationToken: continuationToken
  };

  return new Promise((resolve, reject) => s3.listObjectsV2(params, (err, data) => err ? reject(err) : resolve(data)));
}

function copyObject ({ s3, sourceBucketName, sourceKey, destinationBucketName, destinationKey }) {
  const params = {
    Bucket: destinationBucketName,
    CopySource: `/${sourceBucketName}/${encodeURIComponent(sourceKey)}`,
    Key: destinationKey
  };

  return new Promise((resolve, reject) => s3.copyObject(params, (err, data) => err ? reject(err) : resolve(data)));
}

function uploadZipFile ({ s3, bucketName, key, data }) {
  const params = {
    Bucket: bucketName,
    Key: key,
    Body: data,
    ContentType: 'application/zip',
    ServerSideEncryption: 'AES256',
    StorageClass: 'STANDARD'
  };
  return new Promise((resolve, reject) => s3.upload(params, (err, data) => err ? reject(err) : resolve(data)));
}

module.exports = {
  listAllObjects,
  copyObject,
  uploadZipFile,
};
