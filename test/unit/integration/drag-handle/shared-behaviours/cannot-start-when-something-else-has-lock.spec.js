// @flow
import invariant from 'tiny-invariant';
import React from 'react';
import { render } from 'react-testing-library';
import { isDragging } from '../util';
import App from '../app';
import type { SensorAPI } from '../../../../../src/types';
import { forEachSensor, type Control, simpleLift } from '../controls';

forEachSensor((control: Control) => {
  it('should not start a drag if another sensor is capturing', () => {
    let api: SensorAPI;
    function greedy(value: SensorAPI) {
      api = value;
    }
    const { getByText } = render(<App sensors={[greedy]} />);
    const handle: HTMLElement = getByText('item: 0');

    invariant(api, 'Expected function to be set');
    api.tryGetLock('0');

    // won't be able to lift as the lock is already claimed
    simpleLift(control, handle);

    expect(isDragging(handle)).toBe(false);
  });
});
