// @flow
const path = require('path');

const common = {
  context: path.resolve(__dirname, '..', '..'),
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
    // strictExportPresence: true,
    rules: [
      {
        test: /\.(png|jpg|gif)$/i,
        use: [
          {
            loader: 'url-loader',
            options: {
              // limit: false,
            },
          },
        ],
      },
      {
        test: /jsx?$/,
        // type: "javascript/auto",
        exclude: [/node_modules/],
        use: [
          {
            loader: 'babel-loader',
            options: {
              compact: true,
              babelrc: false,
              presets: [
                '@babel/react',
                '@babel/flow',
                ['@babel/env', { modules: false, loose: true }],
              ],
              plugins: [
                ['@babel/proposal-class-properties', { loose: true }],
                ['@babel/proposal-object-rest-spread', { loose: true }],
              ],
              comments: false,
            },
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
    // /png$/,
  ],
};

module.exports = [
  Object.assign({}, common, {
    entry: path.resolve(__dirname, 'client.js'),
    name: 'client',
  }),
  Object.assign({}, common, {
    entry: path.resolve(__dirname, 'server.js'),
    name: 'server',
    target: 'web',
    output: {
      filename: 'server.js',
      path: path.resolve(__dirname, 'dist'),
      libraryTarget: 'commonjs2',
    },
  }),
];
