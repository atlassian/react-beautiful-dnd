import React from 'react';
import { configure, addDecorator } from '@storybook/react';
import { withOptions } from '@storybook/addon-options';
import PopIframeDecorator from './decorator/pop-iframe';
// adding css reset - storybook includes a css loader
import '@atlaskit/css-reset';
import { version } from '../package.json';

addDecorator(
  withOptions({
    name: 'react-beautiful-dnd',
    url: 'https://github.com/atlassian/react-beautiful-dnd',
    showAddonPanel: false,
  }),
);

addDecorator(PopIframeDecorator);

// automatically import all files ending in *.stories.js
const req = require.context('../stories/', true, /.stories.js$/);

function loadStories() {
  req.keys().forEach(filename => req(filename));
}

configure(loadStories, module);

// Doing this more complex check as console.table || console.log makes CI cry
const table = Object.prototype.hasOwnProperty.call(console, 'table')
  ? console.table
  : console.log;

console.log('environment');
table([
  ['react-beautiful-dnd version', version],
  ['react version', React.version],
  ['process.env.NODE_ENV', process.env.NODE_ENV],
]);
