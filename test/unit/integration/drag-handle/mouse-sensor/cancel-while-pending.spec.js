// @flow
import React from 'react';
import { fireEvent, render } from 'react-testing-library';
import * as keyCodes from '../../../../../src/view/key-codes';
import { sloppyClickThreshold } from '../../../../../src/view/use-sensor-marshal/sensors/util/is-sloppy-click-threshold-exceeded';
import App from '../app';
import { isDragging } from '../util';
import { getStartingMouseDown } from './util';
import supportedEventName from '../../../../../src/view/use-sensor-marshal/sensors/util/supported-page-visibility-event-name';

it(`should cancel a pending drag with keydown`, () => {
  Object.keys(keyCodes).forEach((keyCode: string) => {
    const { getByText, unmount } = render(<App />);
    const handle: HTMLElement = getByText('item: 0');

    fireEvent.mouseDown(handle, getStartingMouseDown());

    // abort
    const event: Event = new KeyboardEvent('keydown', {
      keyCode,
      bubbles: true,
      cancelable: true,
    });
    fireEvent(handle, event);

    // would normally start
    fireEvent.mouseMove(handle, {
      clientX: 0,
      clientY: sloppyClickThreshold,
    });

    // drag not started
    expect(isDragging(handle)).toBe(false);
    // default behaviour not prevented on keypress
    expect(event.defaultPrevented).toBe(false);

    unmount();
  });
});

it('should cancel when resize is fired', () => {
  const { getByText } = render(<App />);
  const handle: HTMLElement = getByText('item: 0');

  fireEvent.mouseDown(handle, getStartingMouseDown());

  // abort
  const event: Event = new Event('resize', {
    bubbles: true,
    cancelable: true,
  });
  fireEvent(handle, event);

  // would normally start
  fireEvent.mouseMove(handle, {
    clientX: 0,
    clientY: sloppyClickThreshold,
  });

  // drag not started
  expect(isDragging(handle)).toBe(false);
  // default behaviour not prevented on keypress
  expect(event.defaultPrevented).toBe(false);
});

it('should abort when there is a visibility change', () => {
  const { getByText } = render(<App />);
  const handle: HTMLElement = getByText('item: 0');

  fireEvent.mouseDown(handle, getStartingMouseDown());

  // abort
  const event: Event = new Event(supportedEventName, {
    bubbles: true,
    cancelable: true,
  });
  fireEvent(handle, event);

  // would normally start
  fireEvent.mouseMove(handle, {
    clientX: 0,
    clientY: sloppyClickThreshold,
  });

  // event not consumed as it is an indirect cancel
  expect(event.defaultPrevented).toBe(false);
  // drag not started
  expect(isDragging(handle)).toBe(false);
});

it('should abort when there is a window scroll', () => {
  const { getByText } = render(<App />);
  const handle: HTMLElement = getByText('item: 0');

  fireEvent.mouseDown(handle, getStartingMouseDown());

  // abort
  const event: Event = new Event('scroll', {
    target: window,
    bubbles: true,
    cancelable: true,
  });
  fireEvent(window, event);

  // would normally start
  fireEvent.mouseMove(handle, {
    clientX: 0,
    clientY: sloppyClickThreshold,
  });

  // event not consumed as it is an indirect cancel
  expect(event.defaultPrevented).toBe(false);
  // drag not started
  expect(isDragging(handle)).toBe(false);
});
