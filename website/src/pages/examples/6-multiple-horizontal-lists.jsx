// @flow
import React from 'react';
import QuoteApp from '../../components/examples/multiple-horizontal/quote-app';
import { getQuotes } from '../../components/examples/data';
import type { QuoteMap } from '../../components/examples/types';

const alpha: string = 'alpha';
const beta: string = 'beta';
const gamma: string = 'gamma';

const quoteMap: QuoteMap = {
  [alpha]: getQuotes(20),
  [beta]: getQuotes(18),
  [gamma]: getQuotes(22),
};

export default () => (
  <div>
    <div>multiple horizontal lists: stress test</div>
    <QuoteApp initial={quoteMap} />
  </div>
);
