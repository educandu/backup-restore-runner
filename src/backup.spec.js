const sinon = require('sinon');
const slack = require('./slack');
const { S3 } = require('aws-sdk');
const { backup } = require('./backup');
const envHelper = require('./env-helper');
const cleanupRunner = require('./cleanup-runner');
const s3BackupRunner = require('./s3-backup-runner');
const mongoDbBackupRunner = require('./mongodb-backup-runner');

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
    slackClient = { notify: jest.fn() };

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
      expect(slackClient.notify).toHaveBeenCalledWith('Created backup _20210101_103015_ in S3 bucket _myBackupBucket_');
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
      expect(slackClient.notify).toHaveBeenCalledWith('Failed to back up mongoDB _databaseName_', error);
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
      expect(slackClient.notify).toHaveBeenCalledWith('Failed to back up S3 bucket _myBucket_', error);
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
      expect(slackClient.notify).toHaveBeenCalledWith('Failed to clean up S3 bucket _myBackupBucket_', error);
    });
  });
});
