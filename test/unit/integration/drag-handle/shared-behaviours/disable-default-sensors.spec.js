// @flow
import React from 'react';
import { render } from 'react-testing-library';
import { isDragging } from '../util';
import App from '../app';
import { forEachSensor, type Control, simpleLift } from '../controls';

forEachSensor((control: Control) => {
  it('should be able to start a drag if default sensors is disabled', () => {
    const { getByText } = render(<App enableDefaultSensors={false} />);
    const handle: HTMLElement = getByText('item: 0');

    simpleLift(control, handle);
    expect(isDragging(handle)).toBe(false);
  });
});
