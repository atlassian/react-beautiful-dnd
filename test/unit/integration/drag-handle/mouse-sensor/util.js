// @flow
import { fireEvent } from 'react-testing-library';
import { sloppyClickThreshold } from '../../../../../src/view/use-sensor-marshal/sensors/util/is-sloppy-click-threshold-exceeded';

export const primaryButton: number = 0;

export function simpleLift(handle: HTMLElement) {
  fireEvent.mouseDown(handle);
  fireEvent.mouseMove(handle, {
    clientX: 0,
    clientY: sloppyClickThreshold,
  });
}

export function getStartingMouseDown(): MouseEvent {
  return new MouseEvent('mousedown', {
    clientX: 0,
    clientY: 0,
    cancelable: true,
    bubbles: true,
    button: primaryButton,
  });
}
