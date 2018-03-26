// @flow
import React from 'react';
import { storiesOf } from '@storybook/react';
import QuoteApp from '../../components/examples/multiple-vertical/quote-app';
import { getQuotes } from '../../components/examples/data';
import type { QuoteMap } from '../../components/examples/types';

const alpha: string = 'alpha';
const beta: string = 'beta';
const gamma: string = 'gamma';
const delta: string = 'delta';
const epsilon: string = 'epsilon';
const zeta: string = 'zeta';
const eta: string = 'eta';
const theta: string = 'theta';
const iota: string = 'iota';
const kappa: string = 'kappa';

const quoteMap: QuoteMap = {
  [alpha]: getQuotes(7),
  [beta]: getQuotes(3),
  [gamma]: getQuotes(7),
  [delta]: getQuotes(2),
  [epsilon]: getQuotes(10),
  [zeta]: getQuotes(5),
  [eta]: getQuotes(5),
  [theta]: getQuotes(5),
  [iota]: getQuotes(20),
  [kappa]: getQuotes(5),
};

export default () => (
  <div>
    <div>multiple vertical lists: stress test</div>
    <QuoteApp initial={quoteMap} />
  </div>
);
