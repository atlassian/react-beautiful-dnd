// @flow
import React from 'react';
import { render, fireEvent } from '@testing-library/react';
import { type Position } from 'css-box-model';
import App, {
  defaultItemRender,
  type RenderItem,
  type Item,
} from '../drag-handle/app';
import {
  type DraggableStateSnapshot,
  type DropAnimation,
} from '../../../../src';
import {
  simpleLift,
  mouse,
  keyboard,
  getTransitionEnd,
} from '../drag-handle/controls';
import { isDragging, isDropAnimating } from '../drag-handle/util';
import {
  transitions,
  timings,
  curves,
  combine,
} from '../../../../src/animation';
import { zIndexOptions } from '../../../../src/view/draggable/get-style';
import { getComputedSpacing } from '../../../utils/dimension';
import {
  renderItemAndSpyOnSnapshot,
  withPoorCombineDimensionMocks,
} from './util';

it('should animate a drop to the required offset', () => {
  const { getByText } = render(<App />);
  const handle: HTMLElement = getByText('item: 0');

  simpleLift(mouse, handle);
  expect(isDragging(handle)).toBe(true);

  mouse.move(handle);

  // start a drop
  fireEvent.mouseUp(handle);
  expect(isDropAnimating(handle)).toBe(true);
  expect(handle.style.position).toBe('fixed');

  // moving back to origin so no transform
  expect(handle.style.transform).toBe('');
  expect(handle.style.transition).toBe(transitions.drop(timings.minDropTime));
  expect(handle.style.zIndex).toBe(`${zIndexOptions.dropAnimating}`);

  // completing drop
  fireEvent(handle, getTransitionEnd());
  expect(isDropAnimating(handle)).toBe(false);
  // transition cleared
  expect(handle.style.transition).toBe('');
  // position: fixed cleared
  expect(handle.style.position).toBe('');
});

it('should provide the correct snapshot to consumers', () => {
  const snapshotSpy = jest.fn();
  const renderItem: RenderItem = renderItemAndSpyOnSnapshot(snapshotSpy);

  const { getByText } = render(<App renderItem={renderItem} />);
  const handle: HTMLElement = getByText('item: 0');
  expect(snapshotSpy).toHaveBeenCalledTimes(1);

  simpleLift(mouse, handle);
  expect(isDragging(handle)).toBe(true);
  expect(snapshotSpy).toHaveBeenCalledTimes(2);

  mouse.move(handle);

  // start a drop
  fireEvent.mouseUp(handle);
  expect(isDropAnimating(handle)).toBe(true);

  const snapshot = snapshotSpy.mock.calls[snapshotSpy.mock.calls.length - 1][0];

  const dropping: DropAnimation = {
    duration: timings.minDropTime,
    curve: curves.drop,
    moveTo: { x: 0, y: 0 },
    opacity: null,
    scale: null,
  };
  const expected: DraggableStateSnapshot = {
    isDragging: true,
    isDropAnimating: true,
    dropAnimation: dropping,
    // due to the movement we are no longer over a droppable due
    // do not dimensions being set
    draggingOver: null,
    combineWith: null,
    combineTargetFor: null,
    mode: 'FLUID',
  };
  expect(snapshot).toEqual(expected);
});

it('should animate scale and opacity when combining', () => {
  withPoorCombineDimensionMocks(() => {
    const snapshotSpy = jest.fn();
    const renderItem: RenderItem = renderItemAndSpyOnSnapshot(snapshotSpy);

    const { getByText } = render(
      <App renderItem={renderItem} isCombineEnabled />,
    );
    const handle: HTMLElement = getByText('item: 0');

    simpleLift(mouse, handle);

    mouse.move(handle);
    fireEvent.mouseUp(handle);

    const snapshot =
      snapshotSpy.mock.calls[snapshotSpy.mock.calls.length - 1][0];

    const dropping: DropAnimation = {
      // force cast to number :D
      duration: ((expect.any(Number): any): number),
      curve: curves.drop,
      // will be moving to center
      moveTo: ((expect.any(Object): any): Position),
      opacity: 0,
      scale: combine.scale.drop,
    };
    const expected: DraggableStateSnapshot = {
      isDragging: true,
      isDropAnimating: true,
      dropAnimation: dropping,
      draggingOver: 'droppable',
      combineWith: '1',
      combineTargetFor: null,
      mode: 'FLUID',
    };
    expect(snapshot).toEqual(expected);
    expect(handle.style.opacity).toBe(`${combine.opacity.drop}`);
    expect(handle.style.transition).toBe(transitions.drop(0.34));
    expect(handle.style.transform).toEqual(
      expect.stringContaining(`scale(${combine.scale.drop})`),
    );
  });
});

it('should not trigger a drop animation finished if a transitionend occurs that is a non-primary property', () => {
  const { getByText } = render(<App />);
  const handle: HTMLElement = getByText('item: 0');

  simpleLift(mouse, handle);
  expect(isDragging(handle)).toBe(true);

  mouse.move(handle);

  // start a drop
  fireEvent.mouseUp(handle);
  expect(isDropAnimating(handle)).toBe(true);

  const event: Event = getTransitionEnd();
  // $FlowFixMe - unknown property
  event.propertyName = 'background';
  fireEvent(handle, event);

  // still drop animating!
  expect(isDropAnimating(handle)).toBe(true);
});

it('should not trigger a drop if a transitionend event occurs when not dropping', () => {
  const { getByText } = render(<App />);
  const handle: HTMLElement = getByText('item: 0');

  mouse.preLift(handle);
  fireEvent(handle, getTransitionEnd());

  mouse.lift(handle);
  fireEvent(handle, getTransitionEnd());
  expect(isDragging(handle)).toBe(true);
  expect(isDropAnimating(handle)).toBe(false);

  mouse.move(handle);
  expect(isDragging(handle)).toBe(true);
  expect(isDropAnimating(handle)).toBe(false);

  fireEvent.mouseUp(handle);
  expect(isDragging(handle)).toBe(true);
  expect(isDropAnimating(handle)).toBe(true);

  fireEvent(handle, getTransitionEnd());
  expect(isDragging(handle)).toBe(false);
  expect(isDropAnimating(handle)).toBe(false);
});
