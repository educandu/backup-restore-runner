# backup-restore-runner

[![codecov](https://codecov.io/gh/educandu/backup-restore-runner/branch/main/graph/badge.svg)](https://codecov.io/gh/educandu/backup-restore-runner)

NodeJS tool for running a MongoDB and an S3 bucket backup (in sequence).

## Prerequisites

* node.js ^18.0.0
* optional: globally installed gulp: `npm i -g gulp-cli`

The output of this repository is a Docker image (`educandu/backup-restore-runner`).

## Environment variables

| Variable | Description | Purpose |
| --- | --- | --- |
| S3_ENDPOINT | The S3 entrypoint (e.g. 'https://s3.eu-central-1.amazonaws.com') | Backup, Restore |
| S3_REGION | The S3 region (e.g. 'eu-central-1') | Backup, Restore |
| S3_ACCESS_KEY | The S3 access key of the auth credentials | Backup, Restore |
| S3_SECRET_KEY | The S3 secret key of the auth credentials | Backup, Restore |
| S3_BUCKET | The name of the S3 bucket to back up | Backup, Restore |
| S3_BACKUP_BUCKET | The name of the S3 bucket storing the backup | Backup, Restore |
| MONGODB_URI | Format: `mongodb+srv://[user]:[pass]@[host]/[name]` | Backup, Restore |
| MONGODB_OBJECT_KEY | The key of the mongoDB backup to restore (e.g. `20211027_092404/project-db-name.zip`) | Restore |
| S3_OBJECT_KEYS_PREFIX | The prefix of the S3 backup to restore (e.g. `20211027_092404/project.cdn.domain/`) | Restore |
| MAX_BACKUP_COUNT | The maximum number of (latest) backups to keep (defaults to 5) | Backup |
| PROJECT_NAME | The name of the project being backed up [Optional] | Backup, Restore |
| SLACK_WEBHOOK_URL | WebhookURL for sending Slack notifications with run statuses [Optional] | Backup, Restore |

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
-e S3_BUCKET="" \
-e S3_BACKUP_BUCKET="" \
-e MONGODB_URI="" \
<imageName> <command>
```
with providing the correct values for the environment variables and as the command, one of the following:
- `backup`
- `restore`

---

## OER learning platform for music

Funded by 'Stiftung Innovation in der Hochschullehre'

<img src="https://stiftung-hochschullehre.de/wp-content/uploads/2020/07/logo_stiftung_hochschullehre_screenshot.jpg)" alt="Logo der Stiftung Innovation in der Hochschullehre" width="200"/>

A Project of the 'Hochschule für Musik und Theater München' (University for Music and Performing Arts)

<img src="https://upload.wikimedia.org/wikipedia/commons/d/d8/Logo_Hochschule_f%C3%BCr_Musik_und_Theater_M%C3%BCnchen_.png" alt="Logo der Hochschule für Musik und Theater München" width="200"/>

Project owner: Hochschule für Musik und Theater München\
Project management: Ulrich Kaiser
