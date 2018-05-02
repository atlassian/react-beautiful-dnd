// @flow
import React from 'react';
import { storiesOf } from '@storybook/react';
import QuoteApp from './src/dynamic/quote-app';

storiesOf('Dynamic', module)
  .add('Dynamic additions and removals during a drag', () => (
    <QuoteApp />
  ));
