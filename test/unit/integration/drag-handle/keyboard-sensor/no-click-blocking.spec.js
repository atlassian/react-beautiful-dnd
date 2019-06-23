// @flow
import React from 'react';
import { render, createEvent, fireEvent } from 'react-testing-library';
import App from '../app';
import { simpleLift, keyboard } from '../controls';

it('should not prevent clicks after a drag', () => {
  const onDragEnd = jest.fn();
  const onDragStart = jest.fn();
  const { getByText } = render(
    <App onDragStart={onDragStart} onDragEnd={onDragEnd} />,
  );
  const handle: HTMLElement = getByText('item: 0');

  simpleLift(keyboard, handle);
  expect(onDragStart).toHaveBeenCalled();
  keyboard.drop(handle);

  const event: Event = createEvent.click(handle);
  fireEvent(handle, event);

  // click not blocked
  expect(event.defaultPrevented).toBe(false);
  expect(onDragEnd).toHaveBeenCalled();
});
