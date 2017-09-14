// @flow
import React from 'react';
import { storiesOf } from '@storybook/react';
import Board from './src/board/board';
import { getQuotes } from './src/data';
import type { QuoteMap } from './src/types';

const todo: string = 'Todo';
const inProgress: string = 'In progress';
const done: string = 'Done';

const columns: QuoteMap = {
  [todo]: getQuotes(7),
  [inProgress]: getQuotes(3),
  [done]: getQuotes(0),
};

storiesOf('board', module)
  .add('task board', () => (
    <Board initial={columns} />
  ));
