// @flow
const path = require('path');

const common = {
  context: path.resolve(__dirname, '..'),
  mode: 'development',
  entry: path.resolve(__dirname, 'main.js'),
  target: 'web',
  output: {
    filename: 'client.js',
    path: path.resolve(__dirname, 'dist'),
  },
  resolve: {
    extensions: ['.ts', '.tsx', '.js', '.jsx', '.mjs'],
  },
  module: {
    rules: [
      {
        test: /\.(png|jpg|gif)$/i,
        use: [
          {
            loader: 'url-loader',
          },
        ],
      },
      {
        test: /jsx?$/,
        exclude: [/node_modules/],
        use: [
          {
            loader: 'babel-loader',
          },
        ],
      },
    ],
  },
  externals: [
    {
      express: 'express',
      fs: 'fs',
      'convert-source-map': 'convert-source-map',
    },
  ],
};

module.exports = [
  { ...common, entry: path.resolve(__dirname, 'client.js'), name: 'client' },
  {
    ...common,
    entry: path.resolve(__dirname, 'server.js'),
    name: 'server',
    target: 'node',
    output: {
      filename: 'server.js',
      path: path.resolve(__dirname, 'dist'),
      libraryTarget: 'commonjs2',
    },
  },
];
