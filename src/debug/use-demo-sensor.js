// @flow
import { useEffect } from 'react';
import { useCallback } from 'use-memo-one';
import type { MovementCallbacks } from '../view/use-sensor-marshal/sensor-types';

function delay(fn: Function, time?: number = 300) {
  return new Promise(resolve => {
    setTimeout(() => {
      fn();
      resolve();
    }, time);
  });
}

export default function useDemoSensor(
  tryStartCapturing: (source: Event | Element) => ?MovementCallbacks,
) {
  const start = useCallback(() => {
    // grabbing the first drag handle we can
    const handle: ?HTMLElement = document.querySelector(
      '[data-rbd-drag-handle-context-id]',
    );
    if (!handle) {
      console.log('could not find drag handle');
      return;
    }

    const callbacks: ?MovementCallbacks = tryStartCapturing(handle);

    if (!callbacks) {
      console.log('unable to start drag');
      return;
    }

    // TODO: this is a bit lame as a programatic api
    callbacks.onLift({
      mode: 'SNAP',
    });

    Promise.resolve()
      .then(() => delay(callbacks.onMoveDown))
      .then(() => delay(callbacks.onMoveDown))
      .then(() => delay(callbacks.onMoveDown))
      .then(() => delay(callbacks.onMoveDown))
      .then(() => delay(callbacks.onMoveDown))
      .then(() => delay(callbacks.onMoveUp))
      .then(() => delay(callbacks.onMoveUp))
      .then(() => delay(callbacks.onDrop));
  }, [tryStartCapturing]);

  useEffect(() => {
    start();
  }, [start]);
}
