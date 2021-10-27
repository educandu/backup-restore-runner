# backup-runner

Tool for running a MongoDB and an S3 bucket backup (in sequence).

## Environment variables

| Variable | Description | Required? |
| --- | --- | --- |
| S3_ENDPOINT | The S3 entrypoint (e.g. 'https://s3.eu-central-1.amazonaws.com') | Yes |
| S3_REGION | The S3 region (e.g. 'eu-central-1') | Yes |
| S3_ACCESS_KEY | The S3 access key of the auth credentials | Yes |
| S3_SECRET_KEY | The S3 secret key of the auth credentials | Yes |
| S3_SOURCE_BUCKET | The name of the S3 bucket to back up | Yes |
| S3_DESTINATION_BUCKET | The name of the S3 bucket to store the backup | Yes |
| MONGODB_URI | Format: `mongodb+srv://[user]:[pass]@[host]/[name]` | Yes |
| DATE_FORMAT | Will represent the folder for the backup in S3. Refer to the DayJS docs for a list of available formatting options | No. Default is `YYYYMMDD_HHmmss`

## Usage

Create the docker image:
`docker build . -t <imageName>`

Start the container (and remove it once the execution is done):
```
docker run --rm \
-e S3_ENDPOINT="" \
-e S3_REGION="" \
-e S3_ACCESS_KEY="" \
-e S3_SECRET_KEY="" \
-e S3_SOURCE_BUCKET="" \
-e S3_DESTINATION_BUCKET="" \
-e MONGODB_URI="" \
<imageName> <command>
```
with providing the correct values for the environment variables and as the command, one of the following:
- `runBackup`
