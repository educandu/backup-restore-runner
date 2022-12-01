const sinon = require('sinon');
const slack = require('./slack');
const { S3 } = require('aws-sdk');
const { restore } = require('./restore');
const envHelper = require('./env-helper');
const s3RestoreRunner = require('./s3-restore-runner');
const mongoDbRestoreRunner = require('./mongodb-restore-runner');
const { beforeEach, afterEach, describe, expect, it } = require('vitest');

describe('restore', () => {
  const sandbox = sinon.createSandbox();

  let slackClient;
  const now = new Date('01.01.2021 10:30:15');

  beforeEach(() => {
    sandbox.useFakeTimers({
      now: now.getTime()
    });
    sandbox.stub(console, 'log');

    sandbox.createStubInstance(S3);
    slackClient = { notify: sinon.fake() };

    sandbox.stub(envHelper, 'getForRestore');
    sandbox.stub(slack, 'getClient').returns(slackClient);
    sandbox.stub(mongoDbRestoreRunner, 'run');
    sandbox.stub(s3RestoreRunner, 'run');
  });

  afterEach(() => {
    sandbox.restore();
  });

  describe('when everything is set up and runs correctly', () => {
    beforeEach(() => {
      envHelper.getForRestore.returns({
        bucketName: 'myBucket',
        backupBucketName: 'myBackupBucket',
        mongoDbUri: 'mongodb+srv://root:password123@198.174.21.23:27017/databaseName',
        slackWebhookUrl: 'mySlackWebhookUrl',
        mongoDbObjectKey: '_20210101_103015_/databaseName.zip',
        s3ObjectKeysPrefix: '_20210101_103015_/myBucketName/'
      });

      return restore();
    });

    it('should call slack.getClient', () => {
      sinon.assert.calledWith(slack.getClient, 'mySlackWebhookUrl');
    });

    it('should call mongoDbRestoreRunner', () => {
      sinon.assert.calledWith(mongoDbRestoreRunner.run, sinon.match({
        bucketName: 'myBackupBucket',
        objectKey: '_20210101_103015_/databaseName.zip',
        mongoDbUri: 'mongodb+srv://root:password123@198.174.21.23:27017/databaseName',
        databaseName: 'databaseName'
      }));
    });

    it('should call s3RestoreRunner', () => {
      sinon.assert.calledWith(s3RestoreRunner.run, sinon.match({
        bucketName: 'myBucket',
        backupBucketName: 'myBackupBucket',
        backupKeysPrefix: '_20210101_103015_/myBucketName/'
      }));
    });

    it('should call slackClient', () => {
      expect(slackClient.notify).toHaveBeenCalledWith('Restored backups __20210101_103015_/databaseName.zip_ and __20210101_103015_/myBucketName/_');
    });
  });

  describe('when mongoDbRestoreRunner fails', () => {
    const error = new Error('Something went wrong');

    beforeEach(() => {
      envHelper.getForRestore.returns({
        bucketName: 'myBucket',
        backupBucketName: 'myBackupBucket',
        mongoDbUri: 'mongodb+srv://root:password123@198.174.21.23:27017/databaseName',
        slackWebhookUrl: 'mySlackWebhookUrl',
        mongoDbObjectKey: '_20210101_103015_/databaseName.zip',
        s3ObjectKeysPrefix: '_20210101_103015_/myBucketName/'
      });

      mongoDbRestoreRunner.run.rejects(error);

      return restore();
    });

    it('should call slack.getClient', () => {
      sinon.assert.calledWith(slack.getClient, 'mySlackWebhookUrl');
    });

    it('should call mongoDbRestoreRunner', () => {
      sinon.assert.calledWith(mongoDbRestoreRunner.run, sinon.match({
        bucketName: 'myBackupBucket',
        objectKey: '_20210101_103015_/databaseName.zip',
        mongoDbUri: 'mongodb+srv://root:password123@198.174.21.23:27017/databaseName',
        databaseName: 'databaseName'
      }));
    });

    it('should call s3RestoreRunner', () => {
      sinon.assert.calledWith(s3RestoreRunner.run, sinon.match({
        bucketName: 'myBucket',
        backupBucketName: 'myBackupBucket',
        backupKeysPrefix: '_20210101_103015_/myBucketName/'
      }));
    });

    it('should call slackClient with the error', () => {
      expect(slackClient.notify).toHaveBeenCalledWith('Failed to restore mongoDB _databaseName_', error);
    });
  });

  describe('when s3RestoreRunner fails', () => {
    const error = new Error('Something went wrong');

    beforeEach(() => {
      envHelper.getForRestore.returns({
        bucketName: 'myBucket',
        backupBucketName: 'myBackupBucket',
        mongoDbUri: 'mongodb+srv://root:password123@198.174.21.23:27017/databaseName',
        slackWebhookUrl: 'mySlackWebhookUrl',
        mongoDbObjectKey: '_20210101_103015_/databaseName.zip',
        s3ObjectKeysPrefix: '_20210101_103015_/myBucketName/'
      });

      s3RestoreRunner.run.rejects(error);

      return restore();
    });

    it('should call slack.getClient', () => {
      sinon.assert.calledWith(slack.getClient, 'mySlackWebhookUrl');
    });

    it('should call mongoDbRestoreRunner', () => {
      sinon.assert.calledWith(mongoDbRestoreRunner.run, sinon.match({
        bucketName: 'myBackupBucket',
        objectKey: '_20210101_103015_/databaseName.zip',
        mongoDbUri: 'mongodb+srv://root:password123@198.174.21.23:27017/databaseName',
        databaseName: 'databaseName'
      }));
    });

    it('should call s3RestoreRunner', () => {
      sinon.assert.calledWith(s3RestoreRunner.run, sinon.match({
        bucketName: 'myBucket',
        backupBucketName: 'myBackupBucket',
        backupKeysPrefix: '_20210101_103015_/myBucketName/'
      }));
    });

    it('should call slackClient with the error', () => {
      expect(slackClient.notify).toHaveBeenCalledWith('Failed to restore S3 bucket _myBucket_', error);
    });
  });
});
