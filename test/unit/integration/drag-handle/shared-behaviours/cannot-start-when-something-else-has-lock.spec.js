// @flow
import invariant from 'tiny-invariant';
import React from 'react';
import { render } from 'react-testing-library';
import { isDragging } from '../util';
import App from '../app';
import { forEachSensor, type Control, simpleLift } from '../controls';

forEachSensor((control: Control) => {
  it('should not start a drag if another sensor is capturing', () => {
    let tryGetLock;
    function greedy(tryStartCapture) {
      tryGetLock = tryStartCapture;
    }
    const { getByText } = render(<App sensors={[greedy]} />);
    const handle: HTMLElement = getByText('item: 0');

    invariant(tryGetLock, 'Expected function to be set');
    tryGetLock(handle);

    // won't be able to lift as the lock is already claimed
    simpleLift(control, handle);

    expect(isDragging(handle)).toBe(false);
  });
});
