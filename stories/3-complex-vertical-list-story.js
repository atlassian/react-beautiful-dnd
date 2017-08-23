// @flow
import React from 'react';
import { storiesOf } from '@storybook/react';
import NestedQuoteApp from './src/vertical-nested/quote-app';
import GroupedQuoteApp from './src/vertical-grouped/quote-app';
import { authorWithQuotes } from './src/data';

storiesOf('complex vertical list', module)
  .add('grouped', () => (
    <GroupedQuoteApp
      initial={authorWithQuotes}
    />
  ))
  // this is kind of strange - but hey, if you want to!
  .add('nested vertical lists', () => (
    <NestedQuoteApp />
  ));
