// @flow
import React from 'react';
import { render } from '@testing-library/react';
import { isDragging } from '../util';
import App from '../app';
import { forEachSensor, type Control, simpleLift } from '../controls';

forEachSensor((control: Control) => {
  it('should not allow starting after the handle is unmounted', () => {
    const { getByText, unmount } = render(<App />);
    const handle: HTMLElement = getByText('item: 0');

    unmount();

    simpleLift(control, handle);

    expect(isDragging(handle)).toBe(false);
  });
});
