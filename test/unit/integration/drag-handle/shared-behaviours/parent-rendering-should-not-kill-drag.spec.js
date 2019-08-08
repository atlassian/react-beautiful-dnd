// @flow
import React from 'react';
import { render } from '@testing-library/react';
import { isDragging } from '../../utils/helpers';
import App from '../../utils/app';
import { forEachSensor, simpleLift, type Control } from '../../utils/controls';

forEachSensor((control: Control) => {
  it('should not abort a drag if a parent render occurs', () => {
    const { getByText, rerender } = render(<App />);
    const handle: HTMLElement = getByText('item: 0');

    simpleLift(control, handle);
    expect(isDragging(handle)).toBe(true);

    rerender(<App />);

    // handle element is unchanged
    expect(getByText('item: 0')).toBe(handle);
    // it is still dragging
    expect(isDragging(handle)).toBe(true);
  });
});
