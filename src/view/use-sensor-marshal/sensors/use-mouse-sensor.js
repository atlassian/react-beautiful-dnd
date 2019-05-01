// @flow
import { useEffect } from 'react';
import { useCallback } from 'use-memo-one';
import type { SensorHookArgs } from '../sensor-types';

const listenerOptions = {
  passive: false,
  capture: true,
};

export default function useMouseSensor(args: SensorHookArgs) {
  const onMouseDown = useCallback(
    function onMouseDown(event: MouseEvent) {
      if (!args.canStartCapturingFromEvent(event)) {
        return;
      }
      console.log('can start dragging from event');
    },
    [args],
  );

  useEffect(() => {
    window.addEventListener('mousedown', onMouseDown, listenerOptions);
    return () => {
      window.removeEventListener('mousedown', onMouseDown, listenerOptions);
    };
  }, [onMouseDown]);
}
