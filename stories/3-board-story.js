// @flow
import React from 'react';
import { storiesOf } from '@storybook/react';
import Board from './src/board/board';
import { authorQuoteMap, generateQuoteMap } from './src/data';

const data = {
  medium: generateQuoteMap(100),
  large: generateQuoteMap(500),
};

storiesOf('board', module)
  .add('simple', () => (
    <Board initial={authorQuoteMap} />
  ))
  // TODO: revert to large
  .add('large data set', () => (
    <Board initial={data.medium} />
  ))
  .add('long lists in a short container', () => (
    <Board initial={data.medium} containerHeight="60vh" />
  ));
