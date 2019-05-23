// @flow
import React from 'react';
import { createEvent, fireEvent, render } from 'react-testing-library';
import * as keyCodes from '../../../../../src/view/key-codes';
import App, { type Item } from '../app';
import { isDragging } from '../util';
import { simpleLift } from './util';

it('should prevent enter or tab being pressed during a drag', () => {
  const items: Item[] = [{ id: '0', isEnabled: true }];
  const container: HTMLElement = document.createElement('div');
  document.body.appendChild(container);

  const { getByText, rerender } = render(<App items={items} />, {
    container,
    baseElement: container,
  });
  const handle: HTMLElement = getByText('item: 0');

  simpleLift(handle);
  expect(isDragging(handle)).toBe(true);

  console.warn('re-render');
  rerender(<App />);
});
