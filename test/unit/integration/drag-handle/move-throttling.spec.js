// @flow
import invariant from 'tiny-invariant';
import React from 'react';
import type { Position } from 'css-box-model';
import { render } from 'react-testing-library';
import type {
  TryGetActionLock,
  ActionLock,
  Sensor,
} from '../../../../src/types';
import App from './app';
import { isDragging, isDropAnimating, getOffset } from './util';
import { add } from '../../../../src/state/position';

function noop() {}

it('should throttle move events by request animation frame', () => {
  let tryGet: TryGetActionLock;
  const a: Sensor = (tryGetLock: TryGetActionLock) => {
    tryGet = tryGetLock;
  };
  const { getByText } = render(<App sensors={[a]} />);
  invariant(tryGet, 'expected getter to be set');
  const handle: HTMLElement = getByText('item: 0');

  const lock: ?ActionLock = tryGet(handle, noop);
  invariant(lock);

  const initial: Position = { x: 2, y: 3 };
  lock.lift({ mode: 'FLUID', clientSelection: initial });
  // has not moved yet
  expect(getOffset(handle)).toEqual({ x: 0, y: 0 });

  const offset: Position = { x: 1, y: 5 };
  lock.move(add(initial, offset));
  lock.move(add(initial, offset));
  lock.move(add(initial, offset));

  // still not moved
  expect(getOffset(handle)).toEqual({ x: 0, y: 0 });

  // moved after frame
  requestAnimationFrame.step();
  expect(getOffset(handle)).toEqual(offset);
});

it('should cancel any pending moves after a lock is released', () => {
  let tryGet: TryGetActionLock;
  const a: Sensor = (tryGetLock: TryGetActionLock) => {
    tryGet = tryGetLock;
  };
  const { getByText } = render(<App sensors={[a]} />);
  invariant(tryGet, 'expected getter to be set');
  const handle: HTMLElement = getByText('item: 0');

  const lock: ?ActionLock = tryGet(handle, noop);
  invariant(lock);

  const initial: Position = { x: 2, y: 3 };
  lock.lift({ mode: 'FLUID', clientSelection: initial });
  // has not moved yet
  expect(getOffset(handle)).toEqual({ x: 0, y: 0 });

  const offset: Position = { x: 1, y: 5 };
  lock.move(add(initial, offset));
  // not moved yet
  expect(getOffset(handle)).toEqual({ x: 0, y: 0 });

  lock.cancel();

  // will not do anything
  requestAnimationFrame.step();
  expect(getOffset(handle)).toEqual({ x: 0, y: 0 });
});
