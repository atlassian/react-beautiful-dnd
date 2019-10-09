// @flow
const childProcess = require('child_process');
const path = require('path');
const waitPort = require('wait-port');

const ports = {
  storybook: 9002,
  cspServer: 9003,
};

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
    cspServer.kill();
    process.exit(1);
  });
