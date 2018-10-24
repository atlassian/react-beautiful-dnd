// @flow
const childProcess = require('child_process');
const path = require('path');
const waitPort = require('wait-port');

const storybook = childProcess.spawn(process.execPath, [
  path.join('node_modules', '.bin', 'start-storybook'),
  '-p',
  '9002',
]);

process.on('exit', () => {
  storybook.kill();
});

waitPort({
  host: 'localhost',
  port: 9002,
  timeout: 60000,
})
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
    console.error('Storybook did not start in time');
    storybook.kill();
    process.exit(1);
  });
