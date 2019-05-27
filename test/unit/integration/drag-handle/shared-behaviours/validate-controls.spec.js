// @flow
import React from 'react';
import { render } from 'react-testing-library';
import { isDragging } from '../util';
import App from '../app';
import { forEachSensor, type Control } from './controls';

forEachSensor((control: Control) => {
  it('should control the drag through the sensor', () => {
    const { getByText } = render(<App />);
    const handle: HTMLElement = getByText('item: 0');

    control.preLift(handle);
    expect(isDragging(handle)).toBe(false);

    control.lift(handle);
    expect(isDragging(handle)).toBe(true);

    // move
    control.move(handle);
    expect(isDragging(handle)).toBe(true);

    // drop
    control.drop(handle);
    expect(isDragging(handle)).toBe(false);
  });
});
