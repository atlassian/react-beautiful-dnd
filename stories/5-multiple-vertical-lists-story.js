// @flow
import React from 'react';
import { storiesOf } from '@storybook/react';
import QuoteApp from './src/multiple-vertical/quote-app';
import { getQuotes } from './src/data';

const namespaceQuoteIds = (quoteList, namespace) => quoteList.map(
  quote => ({
    ...quote,
    id: `${namespace}::${quote.id}`,
  })
);

const initialQuotes = {
  alpha: namespaceQuoteIds(getQuotes(10), 'alpha'),
  beta: namespaceQuoteIds(getQuotes(3), 'beta'),
  gamma: namespaceQuoteIds(getQuotes(10), 'gamma'),
  delta: namespaceQuoteIds(getQuotes(5), 'delta'),
};

storiesOf('multiple vertical lists', module)
  .add('simple example', () => (
    <QuoteApp initial={initialQuotes} />
  ));
