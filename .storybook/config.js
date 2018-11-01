import React from 'react';
import { configure } from '@storybook/react';
// adding css reset - storybook includes a css loader
import '@atlaskit/css-reset';
import { version } from '../package.json';

// dynamically load in all the stories in the /stories directory
// https://github.com/storybooks/storybook/issues/125#issuecomment-212404756
const req = require.context('../stories/', true, /story\.js$/);

function loadStories() {
  req.keys().forEach(req);
}

configure(loadStories, module);

const table = Object.hasOwnProperty(console, 'table')
  ? console.table
  : console.log;

console.log('environment');
table([
  ['react-beautiful-dnd version', version],
  ['react version', React.version],
  ['process.env.NODE_ENV', process.env.NODE_ENV],
]);
