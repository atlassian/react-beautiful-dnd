// @flow
import React from 'react';
import { storiesOf } from '@storybook/react';
import ReactWindow from './src/virtual/react-window';
import { getQuotes } from './src/data';

storiesOf('Virtual lists', module).add('with react-window', () => (
  <ReactWindow initial={getQuotes(1000)} />
));
