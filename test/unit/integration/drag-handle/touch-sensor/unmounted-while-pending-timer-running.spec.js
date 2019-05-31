// @flow
import React from 'react';
import { render } from 'react-testing-library';
import App from '../app';
import { isDragging } from '../util';
import { touch } from '../controls';

jest.useFakeTimers();

it('should cancel a pending drag when unmounted', () => {
  jest.spyOn(console, 'warn');
  const { getByText, unmount } = render(<App />);
  const handle: HTMLElement = getByText('item: 0');

  touch.preLift(handle);

  unmount();

  // finish lift timer
  jest.runOnlyPendingTimers();

  expect(console.warn).not.toHaveBeenCalled();
  expect(isDragging(handle)).toBe(false);
  console.warn.mockRestore();
});
