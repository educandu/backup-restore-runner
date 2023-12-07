import slack from './slack.js';
import { backup } from './backup.js';
import envHelper from './env-helper.js';
import { S3Client } from '@aws-sdk/client-s3';
import cleanupRunner from './cleanup-runner.js';
import s3BackupRunner from './s3-backup-runner.js';
import { assert, match, spy, createSandbox } from 'sinon';
import mongoDbBackupRunner from './mongodb-backup-runner.js';
import { beforeEach, afterEach, describe, it } from 'vitest';

describe('backup', () => {
  const sandbox = createSandbox();

  let slackClient;
  const now = new Date('01.01.2021 10:30:15');

  beforeEach(() => {
    sandbox.useFakeTimers({
      now: now.getTime()
    });
    sandbox.stub(console, 'log');

    sandbox.createStubInstance(S3Client);
    slackClient = { notify: spy() };

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
      assert.calledWith(slack.getClient, 'mySlackWebhookUrl');
    });

    it('should call mongoDbBackupRunner', () => {
      assert.calledWith(mongoDbBackupRunner.run, match({
        mongoDbUri: 'mongodb+srv://root:password123@198.174.21.23:27017/databaseName',
        databaseName: 'databaseName',
        backupBucketName: 'myBackupBucket',
        backupBucketFolder: '20210101_103015'
      }));
    });

    it('should call s3BackupRunner', () => {
      assert.calledWith(s3BackupRunner.run, match({
        bucketName: 'myBucket',
        backupBucketName: 'myBackupBucket',
        backupBucketFolder: '20210101_103015'
      }));
    });

    it('should call cleanupRunner', () => {
      assert.calledWith(cleanupRunner.run, match({
        backupBucketName: 'myBackupBucket',
        maxBackupCount: 15
      }));
    });

    it('should call slackClient', () => {
      assert.calledWith(slackClient.notify, 'Created backup _20210101_103015_ in S3 bucket _myBackupBucket_');
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
      assert.calledWith(slack.getClient, 'mySlackWebhookUrl');
    });

    it('should call mongoDbBackupRunner', () => {
      assert.calledWith(mongoDbBackupRunner.run, match({
        mongoDbUri: 'mongodb+srv://root:password123@198.174.21.23:27017/databaseName',
        databaseName: 'databaseName',
        backupBucketName: 'myBackupBucket',
        backupBucketFolder: '20210101_103015'
      }));
    });

    it('should call s3BackupRunner', () => {
      assert.calledWith(s3BackupRunner.run, match({
        bucketName: 'myBucket',
        backupBucketName: 'myBackupBucket',
        backupBucketFolder: '20210101_103015'
      }));
    });

    it('should not call cleanupRunner', () => {
      assert.notCalled(cleanupRunner.run);
    });

    it('should call slackClient with the error', () => {
      assert.calledWith(slackClient.notify, 'Failed to back up mongoDB _databaseName_', error);
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
      assert.calledWith(slack.getClient, 'mySlackWebhookUrl');
    });

    it('should call mongoDbBackupRunner', () => {
      assert.calledWith(mongoDbBackupRunner.run, match({
        mongoDbUri: 'mongodb+srv://root:password123@198.174.21.23:27017/databaseName',
        databaseName: 'databaseName',
        backupBucketName: 'myBackupBucket',
        backupBucketFolder: '20210101_103015'
      }));
    });

    it('should call s3BackupRunner', () => {
      assert.calledWith(s3BackupRunner.run, match({
        bucketName: 'myBucket',
        backupBucketName: 'myBackupBucket',
        backupBucketFolder: '20210101_103015'
      }));
    });

    it('should not call cleanupRunner', () => {
      assert.notCalled(cleanupRunner.run);
    });

    it('should call slackClient with the error', () => {
      assert.calledWith(slackClient.notify, 'Failed to back up S3 bucket _myBucket_', error);
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
      assert.calledWith(slack.getClient, 'mySlackWebhookUrl');
    });

    it('should call mongoDbBackupRunner', () => {
      assert.calledWith(mongoDbBackupRunner.run, match({
        mongoDbUri: 'mongodb+srv://root:password123@198.174.21.23:27017/databaseName',
        databaseName: 'databaseName',
        backupBucketName: 'myBackupBucket',
        backupBucketFolder: '20210101_103015'
      }));
    });

    it('should call s3BackupRunner', () => {
      assert.calledWith(s3BackupRunner.run, match({
        bucketName: 'myBucket',
        backupBucketName: 'myBackupBucket',
        backupBucketFolder: '20210101_103015'
      }));
    });

    it('should call cleanupRunner', () => {
      assert.calledWith(cleanupRunner.run, match({
        backupBucketName: 'myBackupBucket',
        maxBackupCount: 15
      }));
    });

    it('should call slackClient with the error', () => {
      assert.calledWith(slackClient.notify, 'Failed to clean up S3 bucket _myBackupBucket_', error);
    });
  });
});
