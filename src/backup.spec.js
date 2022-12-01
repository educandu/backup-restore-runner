import sinon from 'sinon';
import { S3 } from 'aws-sdk';
import slack from './slack.js';
import { backup } from './backup.js';
import envHelper from './env-helper.js';
import cleanupRunner from './cleanup-runner.js';
import s3BackupRunner from './s3-backup-runner.js';
import mongoDbBackupRunner from './mongodb-backup-runner.js';
import { beforeEach, afterEach, describe, it } from 'vitest';

describe('backup', () => {
  const sandbox = sinon.createSandbox();

  let slackClient;
  const now = new Date('01.01.2021 10:30:15');

  beforeEach(() => {
    sandbox.useFakeTimers({
      now: now.getTime()
    });
    sandbox.stub(console, 'log');

    sandbox.createStubInstance(S3);
    slackClient = { notify: sinon.spy() };

    sandbox.stub(envHelper, 'getForBackup');
    sandbox.stub(slack, 'getClient').returns(slackClient);
    sandbox.stub(mongoDbBackupRunner, 'run');
    sandbox.stub(s3BackupRunner, 'run');
    sandbox.stub(cleanupRunner, 'run');
  });

  afterEach(() => {
    sandbox.restore();
  });

  describe('when everything is set up and runs correctly', () => {
    beforeEach(() => {
      envHelper.getForBackup.returns({
        bucketName: 'myBucket',
        backupBucketName: 'myBackupBucket',
        mongoDbUri: 'mongodb+srv://root:password123@198.174.21.23:27017/databaseName',
        slackWebhookUrl: 'mySlackWebhookUrl',
        maxBackupCount: 15
      });

      return backup();
    });

    it('should call slack.getClient', () => {
      sinon.assert.calledWith(slack.getClient, 'mySlackWebhookUrl');
    });

    it('should call mongoDbBackupRunner', () => {
      sinon.assert.calledWith(mongoDbBackupRunner.run, sinon.match({
        mongoDbUri: 'mongodb+srv://root:password123@198.174.21.23:27017/databaseName',
        databaseName: 'databaseName',
        backupBucketName: 'myBackupBucket',
        backupBucketFolder: '20210101_103015'
      }));
    });

    it('should call s3BackupRunner', () => {
      sinon.assert.calledWith(s3BackupRunner.run, sinon.match({
        bucketName: 'myBucket',
        backupBucketName: 'myBackupBucket',
        backupBucketFolder: '20210101_103015'
      }));
    });

    it('should call cleanupRunner', () => {
      sinon.assert.calledWith(cleanupRunner.run, sinon.match({
        backupBucketName: 'myBackupBucket',
        maxBackupCount: 15
      }));
    });

    it('should call slackClient', () => {
       sinon.assert.calledWith(slackClient.notify, 'Created backup _20210101_103015_ in S3 bucket _myBackupBucket_');
    });
  });

  describe('when mongoDbBackupRunner fails', () => {
    const error = new Error('Something went wrong');

    beforeEach(() => {
      envHelper.getForBackup.returns({
        bucketName: 'myBucket',
        backupBucketName: 'myBackupBucket',
        mongoDbUri: 'mongodb+srv://root:password123@198.174.21.23:27017/databaseName',
        slackWebhookUrl: 'mySlackWebhookUrl',
        maxBackupCount: 15
      });

      mongoDbBackupRunner.run.rejects(error);

      return backup();
    });

    it('should call slack.getClient', () => {
      sinon.assert.calledWith(slack.getClient, 'mySlackWebhookUrl');
    });

    it('should call mongoDbBackupRunner', () => {
      sinon.assert.calledWith(mongoDbBackupRunner.run, sinon.match({
        mongoDbUri: 'mongodb+srv://root:password123@198.174.21.23:27017/databaseName',
        databaseName: 'databaseName',
        backupBucketName: 'myBackupBucket',
        backupBucketFolder: '20210101_103015'
      }));
    });

    it('should call s3BackupRunner', () => {
      sinon.assert.calledWith(s3BackupRunner.run, sinon.match({
        bucketName: 'myBucket',
        backupBucketName: 'myBackupBucket',
        backupBucketFolder: '20210101_103015'
      }));
    });

    it('should not call cleanupRunner', () => {
      sinon.assert.notCalled(cleanupRunner.run);
    });

    it('should call slackClient with the error', () => {
       sinon.assert.calledWith(slackClient.notify, 'Failed to back up mongoDB _databaseName_', error);
    });
  });

  describe('when s3BackupRunner fails', () => {
    const error = new Error('Something went wrong');

    beforeEach(() => {
      envHelper.getForBackup.returns({
        bucketName: 'myBucket',
        backupBucketName: 'myBackupBucket',
        mongoDbUri: 'mongodb+srv://root:password123@198.174.21.23:27017/databaseName',
        slackWebhookUrl: 'mySlackWebhookUrl',
        maxBackupCount: 15
      });

      s3BackupRunner.run.rejects(error);

      return backup();
    });

    it('should call slack.getClient', () => {
      sinon.assert.calledWith(slack.getClient, 'mySlackWebhookUrl');
    });

    it('should call mongoDbBackupRunner', () => {
      sinon.assert.calledWith(mongoDbBackupRunner.run, sinon.match({
        mongoDbUri: 'mongodb+srv://root:password123@198.174.21.23:27017/databaseName',
        databaseName: 'databaseName',
        backupBucketName: 'myBackupBucket',
        backupBucketFolder: '20210101_103015'
      }));
    });

    it('should call s3BackupRunner', () => {
      sinon.assert.calledWith(s3BackupRunner.run, sinon.match({
        bucketName: 'myBucket',
        backupBucketName: 'myBackupBucket',
        backupBucketFolder: '20210101_103015'
      }));
    });

    it('should not call cleanupRunner', () => {
      sinon.assert.notCalled(cleanupRunner.run);
    });

    it('should call slackClient with the error', () => {
       sinon.assert.calledWith(slackClient.notify, 'Failed to back up S3 bucket _myBucket_', error);
    });
  });

  describe('when cleanupRunner fails', () => {
    const error = new Error('Something went wrong');

    beforeEach(() => {
      envHelper.getForBackup.returns({
        bucketName: 'myBucket',
        backupBucketName: 'myBackupBucket',
        mongoDbUri: 'mongodb+srv://root:password123@198.174.21.23:27017/databaseName',
        slackWebhookUrl: 'mySlackWebhookUrl',
        maxBackupCount: 15
      });

      cleanupRunner.run.rejects(error);

      return backup();
    });

    it('should call slack.getClient', () => {
      sinon.assert.calledWith(slack.getClient, 'mySlackWebhookUrl');
    });

    it('should call mongoDbBackupRunner', () => {
      sinon.assert.calledWith(mongoDbBackupRunner.run, sinon.match({
        mongoDbUri: 'mongodb+srv://root:password123@198.174.21.23:27017/databaseName',
        databaseName: 'databaseName',
        backupBucketName: 'myBackupBucket',
        backupBucketFolder: '20210101_103015'
      }));
    });

    it('should call s3BackupRunner', () => {
      sinon.assert.calledWith(s3BackupRunner.run, sinon.match({
        bucketName: 'myBucket',
        backupBucketName: 'myBackupBucket',
        backupBucketFolder: '20210101_103015'
      }));
    });

    it('should call cleanupRunner', () => {
      sinon.assert.calledWith(cleanupRunner.run, sinon.match({
        backupBucketName: 'myBackupBucket',
        maxBackupCount: 15
      }));
    });

    it('should call slackClient with the error', () => {
       sinon.assert.calledWith(slackClient.notify, 'Failed to clean up S3 bucket _myBackupBucket_', error);
    });
  });
});
