// @flow
import React from 'react';
import { storiesOf } from '@storybook/react';
import QuoteApp from './src/multiple-vertical/quote-app';
import { quotes } from './src/data';

const namespaceQuoteIds = (quoteList, namespace) => quoteList.map(
  quote => ({
    ...quote,
    id: `${namespace}::${quote.id}`,
  })
);

// I don't want these to be random
const alphaQuotes = quotes.slice(0, 2);
const betaQuotes = quotes.slice(6, 8);

const initialQuotes = {
  alpha: namespaceQuoteIds(alphaQuotes, 'alpha'),
  beta: namespaceQuoteIds(betaQuotes, 'beta'),
};

storiesOf('multiple vertical lists', module)
  .add('simple example', () => (
    <QuoteApp initial={initialQuotes} />
  ));
