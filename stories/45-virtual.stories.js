// @flow
import React from 'react';
import { storiesOf } from '@storybook/react';
import ReactWindow from './src/virtual/react-window';
import { getQuotes, generateQuoteMap } from './src/data';
import Board from './src/virtual/board';

storiesOf('Virtual', module)
  .add('list with react-window', () => (
    <ReactWindow initial={getQuotes(10000)} />
  ))
  .add('board with react-window', () => (
    <Board initial={generateQuoteMap(10000)} />
  ));
