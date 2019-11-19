// @flow
import React from 'react';
import { storiesOf } from '@storybook/react';
import MixedSizedItems from './src/mixed-sizes/mixed-size-items';
import MixedSizedLists from './src/mixed-sizes/mixed-size-lists';

storiesOf('mixed sizes', module)
  .add('with a super large draggable', () => <MixedSizedItems />)
  .add('with a super large droppable', () => <MixedSizedLists />);
