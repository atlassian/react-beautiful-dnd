// @flow
import React from 'react';
import { storiesOf } from '@storybook/react';
import Board from './src/board/board';
import { authorQuoteMap, randomAuthorQuotes } from './src/data';

storiesOf('board', module)
  .add('task board', () => (
    <Board initial={authorQuoteMap} />
  ))
  .add('long lists in a short container', () => (
    <Board initial={randomAuthorQuotes} containerHeight="300px" />
  ));
