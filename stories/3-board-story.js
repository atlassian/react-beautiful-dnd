// @flow
import React from 'react';
import { storiesOf } from '@storybook/react';
import Board from './src/board/board';
import { authorQuoteMap, generateQuoteMap } from './src/data';

const data = {
  medium: generateQuoteMap(50),
  large: generateQuoteMap(500),
};

storiesOf('board', module)
  .add('simple', () => (
    <Board initial={authorQuoteMap} />
  ))
  .add('large data set', () => (
    <Board initial={data.large} />
  ))
  .add('long lists in a short container', () => (
    <Board initial={data.medium} containerHeight="300px" />
  ))
  .add('stick to bottom', () => (
    <Board initial={authorQuoteMap} stickToBottom />
  ));
