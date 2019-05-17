// @flow
import React from 'react';
import { fireEvent, render } from 'react-testing-library';
import * as keyCodes from '../../../../../src/view/key-codes';
import App from '../app';
import { isDragging } from '../util';
import { simpleLift } from './util';
import supportedEventName from '../../../../../src/view/use-sensor-marshal/sensors/util/supported-page-visibility-event-name';

it('should cancel when pressing escape', () => {
  const { getByText } = render(<App />);
  const handle: HTMLElement = getByText('item: 0');

  simpleLift(handle);
  expect(isDragging(handle)).toBe(true);

  // cancel
  const event: Event = new KeyboardEvent('keydown', {
    keyCode: keyCodes.escape,
    bubbles: true,
    cancelable: true,
  });

  fireEvent(handle, event);

  // event consumed
  expect(event.defaultPrevented).toBe(true);
  // drag ended
  expect(isDragging(handle)).toBe(false);
});

it('should cancel when window is resized', () => {
  const { getByText } = render(<App />);
  const handle: HTMLElement = getByText('item: 0');

  simpleLift(handle);
  expect(isDragging(handle)).toBe(true);

  // cancel
  const event: Event = new Event('resize', {
    bubbles: true,
    cancelable: true,
  });

  fireEvent(handle, event);

  // event not consumed as it is an indirect cancel
  expect(event.defaultPrevented).toBe(false);
  // drag ended
  expect(isDragging(handle)).toBe(false);
});

it('should cancel when there is a visibility change', () => {
  const { getByText } = render(<App />);
  const handle: HTMLElement = getByText('item: 0');

  simpleLift(handle);
  expect(isDragging(handle)).toBe(true);

  // cancel
  const event: Event = new Event(supportedEventName, {
    bubbles: true,
    cancelable: true,
  });

  fireEvent(handle, event);

  // event not consumed as it is an indirect cancel
  expect(event.defaultPrevented).toBe(false);
  // drag ended
  expect(isDragging(handle)).toBe(false);
});
