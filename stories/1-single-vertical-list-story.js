// @flow
import React from 'react';
import { storiesOf } from '@storybook/react';
import QuoteApp from './components/quote-app';
import data from './components/quotes';

storiesOf('single vertical list', module)
  .add('standard list with reordering', () => (
    <QuoteApp initial={data} />
  ));
