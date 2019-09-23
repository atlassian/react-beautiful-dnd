// @flow
import React from 'react';
import { storiesOf } from '@storybook/react';
import List from './src/virtual/react-window/list';
import { getQuotes } from './src/data';
import ReactWindowBoard from './src/virtual/react-window/board';
import ReactVirtualizedBoard from './src/virtual/react-virtualized/board';

storiesOf('Virtual', module)
  .add('list with react-window', () => <List initial={getQuotes(100)} />)
  .add('board with react-window', () => <ReactWindowBoard />)
  .add('board with react-virtualized', () => <ReactVirtualizedBoard />);
