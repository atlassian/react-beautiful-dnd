// @flow
import invariant from 'tiny-invariant';
import React from 'react';
import { render } from 'react-testing-library';
import type {
  TryGetActionLock,
  PreDragActions,
  DragActions,
  Sensor,
} from '../../../../src/types';
import App from './app';
import { isDragging, isDropAnimating } from './util';

function noop() {}

it('it should not allow pre drag actions when in a dragging phase', () => {
  let first: TryGetActionLock;

  const a: Sensor = (tryGetLock: TryGetActionLock) => {
    first = tryGetLock;
  };

  const { getByText } = render(<App sensors={[a]} />);
  invariant(first, 'expected first to be set');
  const item: HTMLElement = getByText('item: 0');

  const preDrag: ?PreDragActions = first(item);
  invariant(preDrag);

  const drag: DragActions = preDrag.lift({ mode: 'SNAP' });

  // now outdated
  jest.spyOn(console, 'warn').mockImplementation(noop);
  preDrag.abort();
  expect(console.warn).toHaveBeenCalledWith(
    'Cannot abort pre drag when no longer active',
  );
});
