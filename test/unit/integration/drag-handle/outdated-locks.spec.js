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

function noop() {}

jest.spyOn(console, 'warn').mockImplementation(noop);

afterEach(() => {
  console.warn.mockClear();
});

it('should not allow pre drag actions when in a dragging phase', () => {
  let first: TryGetActionLock;
  const a: Sensor = (tryGetLock: TryGetActionLock) => {
    first = tryGetLock;
  };
  const { getByText } = render(<App sensors={[a]} />);
  invariant(first, 'expected first to be set');
  const item: HTMLElement = getByText('item: 0');

  const preDrag: ?PreDragActions = first(item);
  invariant(preDrag);
  // it is currently active
  expect(preDrag.isActive()).toBe(true);

  const drag: DragActions = preDrag.lift({ mode: 'SNAP' });

  // pre drag now outdated
  expect(preDrag.isActive()).toBe(false);
  preDrag.abort();
  expect(console.warn.mock.calls[0][0]).toEqual(
    expect.stringContaining('Cannot perform action'),
  );

  // drag is active - not aborted by preDrag
  expect(drag.isActive()).toBe(true);

  // ending drag
  console.warn.mockClear();
  drag.drop();
  expect(console.warn).not.toHaveBeenCalled();

  // preDrag is still out of date
  preDrag.abort();
  expect(console.warn.mock.calls[0][0]).toEqual(
    expect.stringContaining('Cannot perform action'),
  );
});

it('should not allow drag actions after a drop', () => {
  let first: TryGetActionLock;
  const a: Sensor = (tryGetLock: TryGetActionLock) => {
    first = tryGetLock;
  };
  const { getByText } = render(<App sensors={[a]} />);
  invariant(first, 'expected first to be set');
  const item: HTMLElement = getByText('item: 0');

  const preDrag: ?PreDragActions = first(item);
  invariant(preDrag);
  expect(preDrag.isActive()).toBe(true);

  const drag: DragActions = preDrag.lift({ mode: 'SNAP' });
  expect(drag.isActive()).toBe(true);

  drag.cancel();

  // no longer active
  expect(drag.isActive()).toBe(false);
  expect(console.warn).not.toHaveBeenCalled();

  drag.moveUp();
  expect(console.warn.mock.calls[0][0]).toEqual(
    expect.stringContaining('Cannot perform action'),
  );
});

it('should not allow drag actions after lock lost', () => {
  let first: TryGetActionLock;
  const a: Sensor = (tryGetLock: TryGetActionLock) => {
    first = tryGetLock;
  };
  const { getByText, unmount } = render(<App sensors={[a]} />);
  invariant(first, 'expected first to be set');
  const item: HTMLElement = getByText('item: 0');

  const preDrag: ?PreDragActions = first(item);
  invariant(preDrag);
  expect(preDrag.isActive()).toBe(true);

  // will cause all lock to be lost
  unmount();

  expect(preDrag.isActive()).toBe(false);
});
