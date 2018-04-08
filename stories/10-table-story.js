// @flow
import React from 'react';
import { storiesOf } from '@storybook/react';
import TableApp from './src/table/table-app';
import { quotes } from './src/data';

storiesOf('Tables', module)
  .add('Semantic table reordering', () => (
    <TableApp initial={quotes} />
  ));
