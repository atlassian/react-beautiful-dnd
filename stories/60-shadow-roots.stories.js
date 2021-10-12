// @flow
import React from 'react';
import { storiesOf } from '@storybook/react';
import Simple from './src/simple/simple';
import SimpleWithScroll from './src/simple/simple-scrollable';
import WithMixedSpacing from './src/simple/simple-mixed-spacing';
import {
  inShadowRoot,
  inNestedShadowRoot,
} from './src/shadow-root/inside-shadow-root';
import SimpleWithShadowRoot from './src/shadow-root/simple-with-shadow-root';
import InteractiveElementsApp from './src/interactive-elements/interactive-elements-app';

storiesOf('Shadow Root', module)
  .add('Super Simple - vertical list', () => inShadowRoot(<Simple />))
  .add('Super Simple - vertical list (nested shadow root)', () =>
    inNestedShadowRoot(<Simple />),
  )
  .add('Super Simple - vertical list with scroll (overflow: auto)', () =>
    inShadowRoot(<SimpleWithScroll overflow="auto" />),
  )
  .add('Super Simple - vertical list with scroll (overflow: scroll)', () =>
    inShadowRoot(<SimpleWithScroll overflow="scroll" />),
  )
  .add('Super Simple - with mixed spacing', () =>
    inShadowRoot(<WithMixedSpacing />),
  )
  .add('nested interactive elements - stress test (without styles)', () =>
    inShadowRoot(<InteractiveElementsApp />),
  )
  .add(
    'Super Simple - vertical list (with draggables containing shadowRoots)',
    () => <SimpleWithShadowRoot />,
  );
