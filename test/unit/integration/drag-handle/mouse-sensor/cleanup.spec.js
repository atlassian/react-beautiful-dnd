// @flow
import React from 'react';
import { render } from 'react-testing-library';
import { isDragging } from '../util';
import App from '../app';
import { simpleLift } from './util';

function getCallCount(myMock): number {
  return myMock.mock.calls.length;
}

it('should remove all window listeners when unmounting', () => {
  jest.spyOn(window, 'addEventListener');
  jest.spyOn(window, 'removeEventListener');

  const { unmount } = render(<App />);

  unmount();

  expect(getCallCount(window.addEventListener)).toEqual(
    getCallCount(window.removeEventListener),
  );
});

it('should remove all window listeners when unmounting mid drag', () => {
  jest.spyOn(window, 'addEventListener');
  jest.spyOn(window, 'removeEventListener');

  const { unmount, getByText } = render(<App />);
  const handle: HTMLElement = getByText('item: 0');

  // mid drag
  simpleLift(handle);
  expect(isDragging(handle)).toEqual(true);

  unmount();

  expect(getCallCount(window.addEventListener)).toEqual(
    getCallCount(window.removeEventListener),
  );
});
