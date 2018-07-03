// @flow
import React from 'react';
import { storiesOf } from '@storybook/react';
import WithControls from './src/dynamic/with-controls';
import LazyLoading from './src/dynamic/lazy-loading';

storiesOf('Dynamic changes during a drag', module)
  .add('With controls', () => <WithControls />)
  .add('Lazy loading', () => <LazyLoading />)
  .add('Changes on drag start (onBeforeDragStart)', () => <div>TODO</div>);
