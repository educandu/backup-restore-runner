const Graceful = require('node-graceful');
const { backup } = require('./backup');
const { restore } = require('./restore');

Graceful.timeout = 5000;
Graceful.exitOnDouble = true;
Graceful.captureExceptions = false;

Graceful.on('exit', signal => {
  console.log(`Received ${signal} signal, exiting process ...`);
  process.exit(0);
});

process.on('uncaughtException', err => {
  console.log(err);
  Graceful.exit(1);
});

const command = process.argv[2];

(async () => {
  switch (command) {
    case 'backup':
      await backup();
      break;
    case 'restore':
      await restore();
      break;
    default:
      console.log(`Unknow command ${command}`);
      process.exit(-1);
      break;
  }
})();
