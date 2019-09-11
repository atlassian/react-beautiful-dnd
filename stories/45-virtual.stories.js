// @flow
import React from 'react';
import { storiesOf } from '@storybook/react';
import List from './src/virtual/react-window/list';
import { getQuotes, generateQuoteMap } from './src/data';
import Board from './src/virtual/react-window/board';

storiesOf('Virtual', module)
  .add('list with react-window', () => <List initial={getQuotes(3)} />)
  .add('board with react-window', () => (
    <Board initial={generateQuoteMap(10)} />
  ));
