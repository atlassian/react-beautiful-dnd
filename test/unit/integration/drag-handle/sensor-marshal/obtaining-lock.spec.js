// @flow
import invariant from 'tiny-invariant';
import React from 'react';
import { render } from 'react-testing-library';
import type {
  TryGetLock,
  PreDragActions,
  FluidDragActions,
  SnapDragActions,
  Sensor,
} from '../../../../../src/types';
import App from '../app';
import { isDragging, isDropAnimating } from '../util';

function noop() {}

it('should allow an exclusive lock for drag actions', () => {
  let first: TryGetLock;
  let second: TryGetLock;

  const a: Sensor = (tryGetLock: TryGetLock) => {
    first = tryGetLock;
  };
  const b: Sensor = (tryGetLock: TryGetLock) => {
    second = tryGetLock;
  };

  const { getByText } = render(<App sensors={[a, b]} />);
  invariant(first, 'expected first to be set');
  invariant(second, 'expected second to be set');
  const item0: HTMLElement = getByText('item: 0');
  const item1: HTMLElement = getByText('item: 1');

  // first can get a lock
  expect(first(item0)).toBeTruthy();

  // second cannot get a lock
  expect(second(item0)).toBe(null);

  // first cannot get another lock on the same element
  expect(first(item0)).toBe(null);

  // nothing cannot get lock on a different element
  expect(first(item1)).toBe(null);
  expect(second(item1)).toBe(null);
});

it('should allow a lock to be released', () => {
  let tryGet: TryGetLock;
  const a: Sensor = (tryGetLock: TryGetLock) => {
    tryGet = tryGetLock;
  };

  const { getByText } = render(<App sensors={[a]} />);
  invariant(tryGet, 'expected getter to be set');
  const handle: HTMLElement = getByText('item: 0');

  Array.from({ length: 4 }).forEach(() => {
    // get the lock
    const lock: ?PreDragActions = tryGet(handle, noop);
    expect(lock).toBeTruthy();
    invariant(lock, 'Expected lock to be set');

    // cannot get another lock
    expect(tryGet(handle)).toBe(null);

    // release the lock
    lock.abort();
  });
});

it('should not allow a sensor to obtain a on a dropping item, but can claim one on something else while dragging', () => {
  let tryGet: TryGetLock;
  const a: Sensor = (tryGetLock: TryGetLock) => {
    tryGet = tryGetLock;
  };
  const { getByText } = render(<App sensors={[a]} />);
  invariant(tryGet, 'expected getter to be set');
  const handle: HTMLElement = getByText('item: 0');

  const preDrag: ?PreDragActions = tryGet(handle, noop);
  invariant(preDrag, 'Expected to get lock');

  // drag not started yet
  expect(isDragging(handle)).toBe(false);
  // start a drag
  const actions: FluidDragActions = preDrag.fluidLift({ x: 0, y: 0 });
  expect(isDragging(handle)).toBe(true);

  // release the movement
  actions.move({ x: 100, y: 100 });
  requestAnimationFrame.flush();

  actions.drop();
  expect(isDropAnimating(handle)).toBe(true);

  // lock is no longer active
  expect(actions.isActive()).toBe(false);
  expect(preDrag.isActive()).toBe(false);

  // cannot get a new lock while still dropping
  expect(tryGet(handle, noop)).toBe(null);

  // can get a lock on a handle that is not dropping - while the other is dropping
  expect(tryGet(getByText('item: 1'), noop)).toBeTruthy();
});

it('should release a lock when aborting a pre drag', () => {
  let tryGet: TryGetLock;
  const a: Sensor = (tryGetLock: TryGetLock) => {
    tryGet = tryGetLock;
  };
  const { getByText } = render(<App sensors={[a]} />);
  invariant(tryGet, 'expected getter to be set');
  const handle0: HTMLElement = getByText('item: 0');
  const handle1: HTMLElement = getByText('item: 1');

  const preDrag: ?PreDragActions = tryGet(handle0, noop);
  invariant(preDrag, 'Expected to get lock');
  expect(preDrag.isActive()).toBe(true);
  // should release the lock
  preDrag.abort();
  expect(preDrag.isActive()).toBe(false);

  // can get another lock
  const second: ?PreDragActions = tryGet(handle1, noop);
  expect(second).toBeTruthy();
  invariant(second);
  // need to release this one :)
  second.abort();
  expect(second.isActive()).toBe(false);
});

it('should release a lock when cancelling or dropping a drag', () => {
  let tryGet: TryGetLock;
  const a: Sensor = (tryGetLock: TryGetLock) => {
    tryGet = tryGetLock;
  };
  const { getByText } = render(<App sensors={[a]} />);
  invariant(tryGet, 'expected getter to be set');
  const handle0: HTMLElement = getByText('item: 0');
  const handle1: HTMLElement = getByText('item: 1');

  ['cancel', 'drop'].forEach((property: string) => {
    const preDrag: ?PreDragActions = tryGet(handle0, noop);
    invariant(preDrag, 'Expected to get lock');
    expect(preDrag.isActive()).toBe(true);

    const drag: SnapDragActions = preDrag.snapLift();
    expect(drag.isActive()).toBe(true);

    // cannot get another lock
    const second: ?PreDragActions = tryGet(handle1, noop);
    expect(second).toBe(null);

    // calling canel or drop
    drag[property]();

    // can now get another lock
    const third: ?PreDragActions = tryGet(handle1, noop);
    expect(third).toBeTruthy();
    // need to try to release it
    invariant(third);
    third.abort();
  });
});
