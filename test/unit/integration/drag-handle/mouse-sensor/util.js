// @flow
import { fireEvent } from 'react-testing-library';
import { sloppyClickThreshold } from '../../../../../src/view/use-sensor-marshal/sensors/util/is-sloppy-click-threshold-exceeded';

export const primaryButton = 0;

export function simpleLift(handle: HTMLElement) {
  fireEvent.mouseDown(handle);
  fireEvent.mouseMove(handle, {
    clientX: 0,
    clientY: sloppyClickThreshold,
  });
}
