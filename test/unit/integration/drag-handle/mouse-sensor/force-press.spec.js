// @flow
import React from 'react';
import { render, fireEvent } from '@testing-library/react';
import { mouse, simpleLift } from '../controls';
import App, { type Item } from '../app';
import { isDragging, getDropReason } from '../util';

const mouseForcePressThreshold = 2;
const standardForce = 1;

// $ExpectError - non-standard MouseEvent property
const original = MouseEvent.WEBKIT_FORCE_AT_FORCE_MOUSE_DOWN;

function setForceDownThreshold(value?: number) {
  // $ExpectError - non-standard MouseEvent property
  MouseEvent.WEBKIT_FORCE_AT_FORCE_MOUSE_DOWN = value;
}

function getForceChangeEvent(value?: number) {
  const event: Event = new Event('webkitmouseforcechanged', {
    bubbles: true,
    cancelable: true,
  });
  // $ExpectError - being amazing
  event.webkitForce = value;
  return event;
}

beforeEach(() => {
  setForceDownThreshold(mouseForcePressThreshold);
});

afterAll(() => {
  setForceDownThreshold(original);
});

it('should log a warning if a mouse force changed event is fired when there is no force value', () => {
  const warn = jest.spyOn(console, 'warn').mockImplementation(() => {});
  setForceDownThreshold(mouseForcePressThreshold);
  const { getByText } = render(<App />);
  const handle: HTMLElement = getByText('item: 0');

  simpleLift(mouse, handle);

  expect(warn).not.toHaveBeenCalled();
  // not providing any force value
  fireEvent(handle, getForceChangeEvent());
  expect(warn).toHaveBeenCalled();
  warn.mockRestore();
});

it('should log a warning if a mouse force changed event is fired when there is no MouseEvent.WEBKIT_FORCE_AT_FORCE_MOUSE_DOWN global', () => {
  const warn = jest.spyOn(console, 'warn').mockImplementation(() => {});
  // not setting force threshold
  setForceDownThreshold();
  const { getByText } = render(<App />);
  const handle: HTMLElement = getByText('item: 0');

  simpleLift(mouse, handle);

  expect(warn).not.toHaveBeenCalled();
  fireEvent(handle, getForceChangeEvent(standardForce));
  expect(warn).toHaveBeenCalled();
  warn.mockRestore();
});

describe('force press is not respected', () => {
  it('should not respect the force press by default', () => {
    setForceDownThreshold(mouseForcePressThreshold);
    const { getByText } = render(<App />);
    const handle: HTMLElement = getByText('item: 0');

    mouse.preLift(handle);
    const forcePress1: Event = getForceChangeEvent(standardForce);
    fireEvent(handle, forcePress1);

    // opting out of default force press behaviour
    expect(forcePress1.defaultPrevented).toBe(true);

    // able to continue the lift
    mouse.lift(handle);
    expect(isDragging(handle)).toBe(true);

    const forcePress2: Event = getForceChangeEvent(standardForce);
    fireEvent(handle, forcePress2);
    expect(forcePress2.defaultPrevented).toBe(true);

    // still dragging
    expect(isDragging(handle)).toBe(true);
  });
});

describe('force press is respected', () => {
  it('should not cancel a pending drag if not enough force is applied', () => {
    setForceDownThreshold(mouseForcePressThreshold);
    const items: Item[] = [{ id: '0', shouldRespectForcePress: true }];
    const { getByText } = render(<App items={items} />);
    const handle: HTMLElement = getByText('item: 0');

    mouse.preLift(handle);
    const forcePress: Event = getForceChangeEvent(standardForce);
    fireEvent(handle, forcePress);

    // allow the force press event to occur
    expect(forcePress.defaultPrevented).toBe(false);

    // complete the lift
    mouse.lift(handle);

    expect(isDragging(handle)).toBe(true);
  });

  it('should cancel a pending drag if enough force is applied', () => {
    setForceDownThreshold(mouseForcePressThreshold);
    const items: Item[] = [{ id: '0', shouldRespectForcePress: true }];
    const { getByText } = render(<App items={items} />);
    const handle: HTMLElement = getByText('item: 0');

    mouse.preLift(handle);
    const forcePress: Event = getForceChangeEvent(mouseForcePressThreshold);
    fireEvent(handle, forcePress);

    // allow the force press event to occur
    expect(forcePress.defaultPrevented).toBe(false);

    // complete the lift
    mouse.lift(handle);

    expect(isDragging(handle)).toBe(false);
  });

  it('should cancel a drag if enough force is applied', () => {
    const onDragEnd = jest.fn();
    setForceDownThreshold(mouseForcePressThreshold);
    const items: Item[] = [{ id: '0', shouldRespectForcePress: true }];
    const { getByText } = render(<App items={items} onDragEnd={onDragEnd} />);
    const handle: HTMLElement = getByText('item: 0');

    simpleLift(mouse, handle);

    const forcePress: Event = getForceChangeEvent(mouseForcePressThreshold);
    fireEvent(handle, forcePress);

    // allow the force press event to occur
    expect(forcePress.defaultPrevented).toBe(false);
    // drag cancelled
    expect(isDragging(handle)).toBe(false);
    expect(getDropReason(onDragEnd)).toBe('CANCEL');
  });

  it('should not cancel a drag if not enough force is applied', () => {
    setForceDownThreshold(mouseForcePressThreshold);
    const items: Item[] = [{ id: '0', shouldRespectForcePress: true }];
    const { getByText } = render(<App items={items} />);
    const handle: HTMLElement = getByText('item: 0');

    simpleLift(mouse, handle);

    const forcePress: Event = getForceChangeEvent(standardForce);
    fireEvent(handle, forcePress);

    // allow the force press event to occur
    expect(forcePress.defaultPrevented).toBe(false);
    // drag not aborted
    expect(isDragging(handle)).toBe(true);
  });
});
