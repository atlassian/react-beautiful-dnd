// @flow
import invariant from 'tiny-invariant';
import React from 'react';
import { render, fireEvent, createEvent } from '@testing-library/react';
import type {
  SensorAPI,
  Sensor,
  PreDragActions,
  SnapDragActions,
} from '../../../../../src/types';
import App from '../../util/app';

it('should block a single click if requested', () => {
  let api: SensorAPI;
  const sensor: Sensor = (value: SensorAPI) => {
    api = value;
  };

  const { getByText } = render(
    <React.Fragment>
      <App sensors={[sensor]} />
    </React.Fragment>,
  );
  const handle: HTMLElement = getByText('item: 0');
  invariant(api);

  // trigger a drop
  const preDrag: ?PreDragActions = api.tryGetLock('0');
  invariant(preDrag);
  const drag: SnapDragActions = preDrag.snapLift();
  drag.drop({ shouldBlockNextClick: true });

  // fire click
  const first: MouseEvent = createEvent.click(handle);
  const second: MouseEvent = createEvent.click(handle);
  fireEvent(handle, first);
  fireEvent(handle, second);

  // only first click is prevented
  expect(first.defaultPrevented).toBe(true);
  expect(second.defaultPrevented).toBe(false);
});

it('should not block any clicks if not requested', () => {
  let api: SensorAPI;

  const a: Sensor = (value: SensorAPI) => {
    api = value;
  };

  const { getByText } = render(
    <React.Fragment>
      <App sensors={[a]} />
    </React.Fragment>,
  );
  const handle: HTMLElement = getByText('item: 0');
  invariant(api);

  // trigger a drop
  const preDrag: ?PreDragActions = api.tryGetLock('0');
  invariant(preDrag);
  const drag: SnapDragActions = preDrag.snapLift();
  drag.drop({ shouldBlockNextClick: false });

  // fire click
  const first: MouseEvent = createEvent.click(handle);
  fireEvent(handle, first);

  // click not prevented
  expect(first.defaultPrevented).toBe(false);
});
