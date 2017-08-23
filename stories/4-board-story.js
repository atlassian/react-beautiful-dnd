// @flow
import React from 'react';
import { storiesOf } from '@storybook/react';
import Board from './src/board/board';
import { authorWithQuotes } from './src/data';

storiesOf('board', module)
  .add('task board', () => (
    <Board initial={authorWithQuotes} />
  ));
