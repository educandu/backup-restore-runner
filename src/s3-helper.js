import mime from 'mime';
import { S3Client } from '@aws-sdk/client-s3';

export function createS3Client({ endpoint, region, accessKey, secretKey }) {
  return new S3Client({
    apiVersion: '2006-03-01',
    endpoint,
    region,
    credentials: {
      accessKeyId: accessKey,
      secretAccessKey: secretKey
    }
  });
}

function getObjectHead({ s3, bucketName, key }) {
  const params = {
    Bucket: bucketName,
    Key: key
  };

  return s3.headObject(params);
}

function listNext1000Objects(s3, bucketName, prefix, continuationToken) {
  const params = {
    Bucket: bucketName,
    MaxKeys: 1000,
    ContinuationToken: continuationToken
  };

  if (prefix) {
    params.Prefix = prefix;
  }

  return s3.listObjectsV2(params);
}

async function listAllObjects({ s3, bucketName, keysPrefix }) {
  let result = [];
  let continuationToken = null;

  do {
    const currentResult = await listNext1000Objects(s3, bucketName, keysPrefix, continuationToken);
    if (currentResult.Contents?.length) {
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

  return s3.copyObject(params);
}

function deleteObject({ s3, bucketName, key }) {
  const params = {
    Bucket: bucketName,
    Key: key
  };

  return s3.deleteObject(params);
}

export default {
  listAllObjects,
  copyObject,
  deleteObject
};
