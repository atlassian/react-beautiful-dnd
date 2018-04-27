// @flow
import React from 'react';
import { storiesOf } from '@storybook/react';
import Simple from './src/simple/simple';
import SimpleWithScroll from './src/simple/simple-scrollable';

storiesOf('Super simple', module)
  .add('vertical list', () => (
    <Simple />
  ))
  .add('vertical list with scroll', () => (
    <SimpleWithScroll />
  ));
