// @flow
import React from 'react';
import { storiesOf } from '@storybook/react';
import QuoteApp from './src/multiple-horizontal/quote-app';
import { getQuotes } from './src/data';

const namespaceQuoteIds = (quoteList, namespace) => quoteList.map(
  quote => ({
    ...quote,
    id: `${namespace}::${quote.id}`,
  })
);

const initialQuotes = {
  alpha: namespaceQuoteIds(getQuotes(20), 'alpha'),
  beta: namespaceQuoteIds(getQuotes(18), 'beta'),
  gamma: namespaceQuoteIds(getQuotes(22), 'gamma'),
};

storiesOf('multiple horizontal lists', module)
  .add('stress test', () => (
    <QuoteApp initial={initialQuotes} />
  ));
