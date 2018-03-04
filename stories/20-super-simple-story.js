// @flow
import React from 'react';
import { storiesOf } from '@storybook/react';
import Simple from './src/simple/simple';

storiesOf('Super simple', module)
  .add('vertical list', () => (
    <Simple />
  ));
