import React from 'react';
import { addParameters, configure, addDecorator } from '@storybook/react';
import { create } from '@storybook/theming';
import GlobalStylesDecorator from './decorator/global-styles';
// adding css reset - storybook includes a css loader
import '@atlaskit/css-reset';
import { colors } from '@atlaskit/theme';
import logo from './compressed-logo-rbd.svg';
import { version } from '../package.json';

const theme = create({
  brandImage: logo,
  brandName: 'react-beautiful-dnd',
  brandUrl: 'https://github.com/atlassian/react-beautiful-dnd',
});

addParameters({
  options: {
    // currently not using any addons
    showPanel: false,
    theme,
  },
});

// TODO: use theme
// It looks like the docs are a bit out of sync for v5 so i'll leave this for now
addDecorator(GlobalStylesDecorator);

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
