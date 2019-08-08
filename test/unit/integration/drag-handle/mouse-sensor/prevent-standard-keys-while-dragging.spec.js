// @flow
import React from 'react';
import { createEvent, fireEvent, render } from '@testing-library/react';
import * as keyCodes from '../../../../../src/view/key-codes';
import App from '../../utils/app';
import { isDragging } from '../../utils/helpers';
import { simpleLift, mouse } from '../../utils/controls';

it('should prevent enter or tab being pressed during a drag', () => {
  const { getByText } = render(<App />);
  const handle: HTMLElement = getByText('item: 0');

  simpleLift(mouse, handle);
  expect(isDragging(handle)).toBe(true);

  [keyCodes.enter, keyCodes.tab].forEach((keyCode: number) => {
    const event: Event = createEvent.keyDown(handle, { keyCode });
    fireEvent(handle, event);
    expect(event.defaultPrevented).toBe(true);
    expect(isDragging(handle)).toBe(true);
  });
});
