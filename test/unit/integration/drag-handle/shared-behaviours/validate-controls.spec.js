// @flow
import React from 'react';
import { render } from 'react-testing-library';
import { isDragging } from '../util';
import App from '../app';
import { forEachSensor, type Control } from '../controls';

forEachSensor((control: Control) => {
  it('should control the drag through the sensor', () => {
    const onDragStart = jest.fn();
    const onDragEnd = jest.fn();
    const { getByText } = render(
      <App onDragStart={onDragStart} onDragEnd={onDragEnd} />,
    );
    const handle: HTMLElement = getByText('item: 0');

    control.preLift(handle);
    expect(isDragging(handle)).toBe(false);

    control.lift(handle);
    expect(isDragging(handle)).toBe(true);

    // on drag start is async
    jest.runOnlyPendingTimers();
    expect(onDragStart).toHaveBeenCalled();

    // move
    control.move(handle);
    expect(isDragging(handle)).toBe(true);

    // drop
    expect(onDragEnd).not.toHaveBeenCalled();

    control.drop(handle);
    expect(isDragging(handle)).toBe(false);

    expect(onDragEnd).toHaveBeenCalled();
    expect(onDragEnd.mock.calls[0][0].reason).toBe('DROP');
  });
});
