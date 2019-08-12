// @flow
import React, { type Node } from 'react';
import { render } from '@testing-library/react';
import { type DraggableLocation } from '../../../../src';
import { simpleLift, keyboard } from '../util/controls';
import getBodyElement from '../../../../src/view/get-body-element';
import {
  withPoorDimensionMocks,
  renderItemAndSpy,
  isClone,
  getCallsFor,
  getLast,
} from '../util/helpers';
import App, { type RenderItem } from '../util/app';

it('should no longer render the original draggable while dragging', () => {
  const { getByTestId } = render(<App useClone />);

  // doing this in a loop to ensure that multiple reorders is fine
  Array.from({ length: 4 }).forEach(() => {
    const beforeLift = getByTestId('0');
    simpleLift(keyboard, beforeLift);
    expect(isClone(beforeLift)).toBe(false);

    // after lift there is still only one item - but it is different
    const clone = getByTestId('0');
    expect(clone).not.toBe(beforeLift);
    expect(isClone(clone)).toBe(true);

    keyboard.drop(clone);

    const finished = getByTestId('0');
    expect(finished).not.toBe(clone);
    expect(isClone(finished)).toBe(false);
  });
});

it('should render a dragging item into the container', () => {
  const body = getBodyElement();
  // default location is the body
  {
    const { unmount, getByTestId } = render(<App useClone />);
    simpleLift(keyboard, getByTestId('0'));
    expect(getByTestId('0').parentElement).toBe(body);
    unmount();
  }
  {
    const element: HTMLElement = document.createElement('div');
    body.appendChild(element);
    const { unmount, getByTestId } = render(
      <App useClone getContainerForClone={() => element} />,
    );
    simpleLift(keyboard, getByTestId('0'));
    expect(getByTestId('0').parentElement).toBe(element);
    unmount();
  }
});

it('should give the clone the starting location', () => {
  const spy = jest.fn();
  const renderItem: RenderItem = renderItemAndSpy(spy);
  const { getByTestId } = render(<App renderItem={renderItem} useClone />);

  simpleLift(keyboard, getByTestId('0'));

  const last = getLast(getCallsFor('0', spy));
  const expected: DraggableLocation = {
    droppableId: 'droppable',
    index: 0,
  };
  expect(last[2]).toEqual(expected);
});

// this test is indirectly validating that a clone does not talk the registry or marshal
it('should allow reordering other items when dropping', () => {
  withPoorDimensionMocks(() => {});
});
