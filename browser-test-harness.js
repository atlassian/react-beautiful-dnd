// @flow
const childProcess = require('child_process');
const path = require('path');
const waitPort = require('wait-port');

const storybook = childProcess.spawn(process.execPath, [
  path.join('node_modules', '.bin', 'start-storybook'),
  '-p',
  '9002',
]);

const standalone = childProcess.spawn(process.execPath, [
  path.join('test', 'standalone', 'start.sh'),
  '9003',
]);

process.on('exit', () => {
  storybook.kill();
  standalone.kill();
});

Promise.all([
  waitPort({
    host: 'localhost',
    port: 9003,
    timeout: 60000,
  }),
  waitPort({
    host: 'localhost',
    port: 9002,
    timeout: 60000,
  }),
])
  .then(() => {
    const child = childProcess.spawn(process.argv[2], process.argv.slice(3), {
      stdio: 'inherit',
    });
    process.on('exit', () => {
      child.kill();
    });
    child.on('exit', code => {
      process.exit(code);
    });
  })
  .catch(() => {
    // eslint-disable-next-line no-console
    console.error('Storybook or our stand alone server did not start in time');
    storybook.kill();
    standalone.kill();
    process.exit(1);
  });
