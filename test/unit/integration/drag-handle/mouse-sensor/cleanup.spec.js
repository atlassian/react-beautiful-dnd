// @flow
import invariant from 'tiny-invariant';
import React from 'react';
import type { Position } from 'css-box-model';
import { render, fireEvent } from 'react-testing-library';
import { sloppyClickThreshold } from '../../../../../src/view/use-sensor-marshal/sensors/util/is-sloppy-click-threshold-exceeded';
import * as keyCodes from '../../../../../src/view/key-codes';
import { isDragging } from '../util';
import App, { type Item } from '../app';
import { simpleLift } from './util';

it('should remove all window listeners when unmounting', () => {
  jest.spyOn(window, 'addEventListener');
  jest.spyOn(window, 'removeEventListener');

  const { unmount } = render(<App />);

  unmount();

  expect(window.addEventListener.mock.calls.length).toEqual(
    window.removeEventListener.mock.calls.length,
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

  expect(window.addEventListener.mock.calls.length).toEqual(
    window.removeEventListener.mock.calls.length,
  );
});
