// @flow
import type { Position } from 'css-box-model';
import { fireEvent, act } from '@testing-library/react';
import { mouse, getTransitionEnd } from './controls';
import { sloppyClickThreshold } from '../../../../src/view/use-sensor-marshal/sensors/use-mouse-sensor';

// Not a 'control'. A little more extensible
const expandedMouse = {
  name: 'mouse',
  powerLift: (handle: HTMLElement, point: Position) => {
    fireEvent.mouseDown(handle, { clientX: point.x, clientY: point.y });
    fireEvent.mouseMove(handle, {
      clientX: point.x,
      clientY: point.y + sloppyClickThreshold,
    });
  },
  rawPowerLift: (handle: HTMLElement, point: Position) => {
    const mousedown: MouseEvent = new MouseEvent('mousedown', {
      bubbles: true,
      cancelable: true,
      clientX: point.x,
      clientY: point.y,
    });

    handle.dispatchEvent(mousedown);

    const mousemove: MouseEvent = new MouseEvent('mousemove', {
      bubbles: true,
      cancelable: true,
      clientX: point.x,
      clientY: point.y + sloppyClickThreshold,
    });

    handle.dispatchEvent(mousemove);
  },
  move: (handle: HTMLElement, point: Position) => {
    fireEvent.mouseMove(handle, { clientX: point.x, clientY: point.y });
    // movements are throttled by raf
    act(() => {
      requestAnimationFrame.step();
    });
  },
  startDrop: (handle: HTMLElement) => {
    fireEvent.mouseUp(handle);
  },
  finishDrop: (handle: HTMLElement) => {
    fireEvent(handle, getTransitionEnd());
  },
  powerDrop: (handle: HTMLElement) => {
    mouse.drop(handle);
  },
  cancel: (handle: HTMLElement) => {
    mouse.cancel(handle);
  },
};

export default expandedMouse;
