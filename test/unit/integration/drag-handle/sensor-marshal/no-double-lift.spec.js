// @flow
import invariant from 'tiny-invariant';
import React from 'react';
import { render } from 'react-testing-library';
import type {
  TryGetLock,
  PreDragActions,
  SnapDragActions,
  Sensor,
} from '../../../../../src/types';
import App from '../app';

it('should not allow double lifting', () => {
  let first: TryGetLock;
  const a: Sensor = (tryGetLock: TryGetLock) => {
    first = tryGetLock;
  };
  const { getByText } = render(<App sensors={[a]} />);
  invariant(first, 'expected first to be set');
  const item: HTMLElement = getByText('item: 0');

  const preDrag: ?PreDragActions = first(item);
  invariant(preDrag);
  // it is currently active
  expect(preDrag.isActive()).toBe(true);

  const drag: SnapDragActions = preDrag.snapLift();

  expect(() => preDrag.fluidLift({ x: 0, y: 0 })).toThrow();
  // original lock is gone
  expect(drag.isActive()).toBe(false);

  // yolo
  expect(() => preDrag.snapLift()).toThrow();
});
