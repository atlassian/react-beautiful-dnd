// @flow
const childProcess = require('child_process');
const path = require('path');
const waitPort = require('wait-port');
const ports = require('./server-ports');

const storybook = childProcess.spawn(process.execPath, [
  path.join('node_modules', '.bin', 'start-storybook'),
  '-p',
  `${ports.storybook}`,
]);

const cspServer = childProcess.spawn(process.execPath, [
  path.join('csp-server', 'start.sh'),
  `${ports.cspServer}`,
]);

process.on('exit', () => {
  storybook.kill();
  cspServer.kill();
});

Promise.all([
  waitPort({
    host: 'localhost',
    port: ports.storybook,
    timeout: 60000,
  }),
  waitPort({
    host: 'localhost',
    port: ports.cspServer,
    timeout: 60000,
  }),
])
  .then(() => {
    if (!process.argv[2]) {
      // eslint-disable-next-line no-console
      console.warn('Started servers but no command supplied to run after');
      process.exit();
    }

    const child = childProcess.spawn(process.argv[2], process.argv.slice(3), {
      stdio: 'inherit',
    });
    process.on('exit', () => {
      child.kill();
    });
    child.on('exit', (code) => {
      process.exit(code);
    });
  })
  .catch((error) => {
    // eslint-disable-next-line no-console
    console.error('Unable to spin up standalone servers');
    // eslint-disable-next-line no-console
    console.error(error);
    storybook.kill();
    cspServer.kill();
    process.exit(1);
  });
