// @flow
import React from 'react';
import { storiesOf } from '@storybook/react';
import Board from './src/board/board';
import { authorQuoteMap, randomAuthorQuotes, generateQuoteMap } from './src/data';

const quoteMap = generateQuoteMap(100);

storiesOf('board', module)
  .add('task board', () => (
    <Board initial={quoteMap} />
  ))
  .add('long lists in a short container', () => (
    <Board initial={randomAuthorQuotes} containerHeight="300px" />
  ));
