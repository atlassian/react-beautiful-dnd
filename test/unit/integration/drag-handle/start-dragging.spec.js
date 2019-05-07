// @flow
import React from 'react';
import type { Position } from 'css-box-model';
import { render, fireEvent } from 'react-testing-library';
import { sloppyClickThreshold } from '../../../../src/view/use-sensor-marshal/sensors/util/is-sloppy-click-threshold-exceeded';
import App from './app';

const primaryButton: number = 0;

function isDragging(el: HTMLElement): boolean {
  return el.getAttribute('data-is-dragging') === 'true';
}

function getStartingMouseDown(): MouseEvent {
  return new MouseEvent('mousedown', {
    clientX: 0,
    clientY: 0,
    cancelable: true,
    bubbles: true,
    button: primaryButton,
  });
}

it('should start a drag after sufficient movement', () => {
  const valid: Position[] = [
    { x: 0, y: sloppyClickThreshold },
    { x: 0, y: -sloppyClickThreshold },
    { x: sloppyClickThreshold, y: 0 },
    { x: -sloppyClickThreshold, y: 0 },
  ];

  valid.forEach((point: Position) => {
    const { getByText, unmount } = render(<App />);

    const handle: HTMLElement = getByText('item: 0');

    const mouseDown: MouseEvent = new MouseEvent('mousedown', {
      clientX: 0,
      clientY: 0,
      button: primaryButton,
      bubbles: true,
      cancelable: true,
    });

    fireEvent(handle, mouseDown);
    // important that this is called to prevent focus
    expect(mouseDown.defaultPrevented).toBe(true);

    // not dragging yet
    expect(isDragging(handle)).toBe(false);

    // mouse move to start drag
    const mouseMove: MouseEvent = new MouseEvent('mousemove', {
      target: handle,
      clientX: point.x,
      clientY: point.y,
      bubbles: true,
      cancelable: true,
    });
    fireEvent(window, mouseMove);
    // we are using the event - so prevent default is called
    expect(mouseMove.defaultPrevented).toBe(true);

    // now dragging
    expect(isDragging(handle)).toBe(true);

    unmount();
  });
});

it('should allow standard click events', () => {
  const { getByText, unmount } = render(<App />);
  const handle: HTMLElement = getByText('item: 0');

  const click: MouseEvent = new MouseEvent('click', {
    target: handle,
    bubbles: true,
    cancelable: true,
  });
  fireEvent(handle, click);

  expect(click.defaultPrevented).toBe(false);

  unmount();
});

it('should not call preventDefault on mouse movements while we are not sure if a drag is starting', () => {
  const { getByText, unmount } = render(<App />);
  const handle: HTMLElement = getByText('item: 0');

  // start pending
  fireEvent.mouseDown(handle, {
    clientX: 0,
    clientY: 0,
    button: primaryButton,
  });

  // not dragging yet
  const mouseMove: MouseEvent = new MouseEvent('mousemove', {
    clientX: 0,
    clientY: sloppyClickThreshold - 1,
    cancelable: true,
    bubbles: true,
  });
  fireEvent(handle, mouseMove);

  expect(isDragging(handle)).toBe(false);
  expect(mouseMove.defaultPrevented).toBe(false);

  unmount();
});

it('should call preventDefault on the initial mousedown event to prevent the element gaining focus', () => {
  const { getByText, unmount } = render(<App />);
  const handle: HTMLElement = getByText('item: 0');

  const mouseDown: MouseEvent = new MouseEvent('mousedown', {
    clientX: 0,
    clientY: 0,
    cancelable: true,
    bubbles: true,
    button: primaryButton,
  });
  fireEvent(handle, mouseDown);

  expect(mouseDown.defaultPrevented).toBe(true);

  unmount();
});

it('should allow multiple false starts', () => {
  const { getByText, unmount } = render(<App />);
  const handle: HTMLElement = getByText('item: 0');

  Array.from({ length: 5 }).forEach(() => {
    fireEvent.mouseDown(handle, getStartingMouseDown());
    fireEvent.mouseUp(handle);

    expect(isDragging(handle)).toBe(false);
  });

  fireEvent.mouseDown(handle, getStartingMouseDown());
  fireEvent.mouseMove(handle, {
    clientX: 0,
    clientY: sloppyClickThreshold,
  });

  expect(isDragging(handle)).toBe(true);

  unmount();
});
