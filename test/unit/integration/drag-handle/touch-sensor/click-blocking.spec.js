// @flow
import React from 'react';
import { fireEvent, render, createEvent } from 'react-testing-library';
import App from '../app';
import { touch, simpleLift } from '../controls';

it('should block a click after a drag', () => {
  const { getByText } = render(<App />);
  const handle: HTMLElement = getByText('item: 0');

  simpleLift(touch, handle);
  touch.drop(handle);

  const click: Event = createEvent.click(handle);
  fireEvent(handle, click);

  expect(click.defaultPrevented).toBe(true);
});

it('should not block a click after an aborted pending drag', () => {
  const onDragStart = jest.fn();
  const { getByText } = render(<App onDragStart={onDragStart} />);
  const handle: HTMLElement = getByText('item: 0');

  // aborted before getting to a drag
  touch.preLift(handle);
  touch.cancel(handle);

  const click: Event = createEvent.click(handle);
  fireEvent(handle, click);

  expect(click.defaultPrevented).toBe(false);
  expect(onDragStart).not.toHaveBeenCalled();
});
