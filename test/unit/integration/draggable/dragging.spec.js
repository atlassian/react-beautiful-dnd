// @flow
import React from 'react';
import { render } from '@testing-library/react';
import App, { type RenderItem } from '../drag-handle/app';
import { type DraggableStateSnapshot } from '../../../../src';
import { simpleLift, mouse, keyboard } from '../drag-handle/controls';
import { isDragging } from '../drag-handle/util';
import { transitions, combine } from '../../../../src/animation';
import { zIndexOptions } from '../../../../src/view/draggable/get-style';
import {
  renderItemAndSpyOnSnapshot,
  withPoorCombineDimensionMocks,
} from './util';

it('should move to a provided offset', () => {
  const { getByText } = render(<App />);
  const handle: HTMLElement = getByText('item: 0');

  simpleLift(mouse, handle);
  expect(isDragging(handle)).toBe(true);

  // no transform as we are at {x: 0, y: 0}
  expect(handle.style.transform).toBe('');
  expect(handle.style.transition).toBe(transitions.fluid);
  expect(handle.style.zIndex).toBe(`${zIndexOptions.dragging}`);

  mouse.move(handle);

  expect(handle.style.transform).toBe(`translate(0px, 1px)`);
  expect(handle.style.transition).toBe(transitions.fluid);
  expect(handle.style.zIndex).toBe(`${zIndexOptions.dragging}`);
});

it('should pass on the snapshot', () => {
  const capture = jest.fn();
  const renderItem: RenderItem = renderItemAndSpyOnSnapshot(capture);

  const { getByText } = render(<App renderItem={renderItem} />);
  const handle: HTMLElement = getByText('item: 0');
  expect(capture).toHaveBeenCalledTimes(1);

  simpleLift(mouse, handle);
  expect(isDragging(handle)).toBe(true);
  expect(capture).toHaveBeenCalledTimes(2);

  {
    const snapshot = capture.mock.calls[capture.mock.calls.length - 1][0];

    const lift: DraggableStateSnapshot = {
      isDragging: true,
      isDropAnimating: false,
      dropAnimation: null,
      draggingOver: 'droppable',
      combineWith: null,
      combineTargetFor: null,
      mode: 'FLUID',
    };
    expect(snapshot).toEqual(lift);
  }

  mouse.move(handle);

  {
    const snapshot = capture.mock.calls[capture.mock.calls.length - 1][0];

    const move: DraggableStateSnapshot = {
      isDragging: true,
      isDropAnimating: false,
      dropAnimation: null,
      // cleared because we are not setting any dimensions and we are
      // no longer over anything
      draggingOver: null,
      combineWith: null,
      combineTargetFor: null,
      mode: 'FLUID',
    };
    expect(snapshot).toEqual(move);
  }
});

it('should animate movements when in snap mode', () => {
  const { getByText } = render(<App />);
  const handle: HTMLElement = getByText('item: 0');

  simpleLift(keyboard, handle);

  expect(isDragging(handle)).toBe(true);
  expect(handle.style.transition).toBe(transitions.snap);
});

it('should update the snapshot and opacity when combining with another item', () => {
  withPoorCombineDimensionMocks(() => {
    const snapshotSpy = jest.fn();
    const renderItem: RenderItem = renderItemAndSpyOnSnapshot(snapshotSpy);

    const { getByText } = render(
      <App renderItem={renderItem} isCombineEnabled />,
    );
    const handle: HTMLElement = getByText('item: 0');

    simpleLift(mouse, handle);

    snapshotSpy.mockClear();

    mouse.move(handle);

    const snapshot = snapshotSpy.mock.calls[0][0];

    const expected: DraggableStateSnapshot = {
      isDragging: true,
      isDropAnimating: false,
      dropAnimation: null,
      draggingOver: 'droppable',
      // combining with #1
      combineWith: '1',
      combineTargetFor: null,
      mode: 'FLUID',
    };
    expect(snapshot).toEqual(expected);
    expect(handle.style.opacity).toBe(`${combine.opacity.combining}`);
  });
});
