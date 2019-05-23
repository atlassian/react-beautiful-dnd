// @flow
import React from 'react';
import { render } from 'react-testing-library';
import { isDragging } from '../util';
import { simpleLift } from './util';
import App from '../app';

it('should not abort a drag if a parent render occurs', () => {
  const { getByText, rerender } = render(<App />);
  const handle: HTMLElement = getByText('item: 0');

  simpleLift(handle);
  expect(isDragging(handle)).toBe(true);

  rerender(<App />);

  // handle element is unchanged
  expect(getByText('item: 0')).toBe(handle);
  // it is still dragging
  expect(isDragging(handle)).toBe(true);
});
