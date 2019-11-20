// @flow
import React from 'react';
import { storiesOf } from '@storybook/react';
import MixedSizedItems from './src/mixed-sizes/mixed-size-items';
import MixedSizedLists from './src/mixed-sizes/mixed-size-lists';

storiesOf('mixed sizes', module)
  .add('with large draggable size variance', () => <MixedSizedItems />)
  .add('with large droppable size variance', () => <MixedSizedLists />);
