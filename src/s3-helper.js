import mime from 'mime';

function getObjectHead({ s3, bucketName, key }) {
  const params = {
    Bucket: bucketName,
    Key: key
  };

  return new Promise((resolve, reject) => {
    s3.headObject(params, (err, data) => err ? reject(err) : resolve(data));
  });
}

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

async function copyObject({ s3, sourceBucketName, sourceKey, destinationBucketName, destinationKey, ensureContentType }) {
  const params = {
    Bucket: destinationBucketName,
    CopySource: `/${sourceBucketName}/${encodeURIComponent(sourceKey)}`,
    Key: destinationKey
  };

  if (ensureContentType) {
    const head = await getObjectHead({ s3, bucketName: sourceBucketName, key: sourceKey });
    const contentType = mime.getType(sourceKey) || 'application/octet-stream';

    params.Metadata = head.Metadata;
    params.ContentType = contentType;
    params.MetadataDirective = 'REPLACE';
  }

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

export default {
  listAllObjects,
  copyObject,
  deleteObject
};
