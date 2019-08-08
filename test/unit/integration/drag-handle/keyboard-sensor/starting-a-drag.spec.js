// @flow
import React from 'react';
import { render, createEvent, fireEvent } from '@testing-library/react';
import App from '../../utils/app';
import { isDragging } from '../../utils/helpers';
import * as keyCodes from '../../../../../src/view/key-codes';

it('should prevent the default keyboard action when lifting', () => {
  const { getByText } = render(<App />);
  const handle: HTMLElement = getByText('item: 0');

  const event: Event = createEvent.keyDown(handle, { keyCode: keyCodes.space });
  fireEvent(handle, event);

  expect(isDragging(handle)).toBe(true);
  expect(event.defaultPrevented).toBe(true);
});
