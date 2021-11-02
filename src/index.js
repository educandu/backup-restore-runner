const { backup } = require('./backup');
const { restore } = require('./restore');

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
