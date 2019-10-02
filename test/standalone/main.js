/* eslint-disable id-length */
// @flow

const webpack = require('webpack');
const requireFromString = require('require-from-string');
const MemoryFS = require('memory-fs');
const path = require('path');
const config = require('./webpack.config');

const fs = new MemoryFS();
const compiler = webpack(config);

// $ExpectError
compiler.outputFileSystem = fs;
// $ExpectError
const outputPath = compiler.compilers.find(cfg => cfg.name === 'client')
  .outputPath;

compiler.run(() => {
  const content = fs.readFileSync(path.resolve(outputPath, 'server.js'));
  const server = requireFromString(content.toString()).default;
  server(process.argv[2] || 9003, outputPath, fs);
});
