// @flow
import React from 'react';
import { storiesOf } from '@storybook/react';
import Board from './src/board/board';
import { authorQuoteMap } from './src/data';

storiesOf('board', module)
  .add('task board', () => (
    <Board initial={authorQuoteMap} />
  ));
