// @flow
import React from 'react';
import { storiesOf } from '@storybook/react';
import QuoteApp from './src/multiple-vertical/quote-app';
import { getQuotes } from './src/data';
import type { QuoteMap } from './src/types';

const alpha: string = 'alpha';
const beta: string = 'beta';
const gamma: string = 'gamma';
const delta: string = 'delta';

const quoteMap: QuoteMap = {
  [alpha]: getQuotes(20),
  [beta]: getQuotes(3),
  [gamma]: getQuotes(20),
  [delta]: getQuotes(0),
};

storiesOf('multiple vertical lists', module)
  .add('stress test', () => (
    <QuoteApp initial={quoteMap} />
  ));
