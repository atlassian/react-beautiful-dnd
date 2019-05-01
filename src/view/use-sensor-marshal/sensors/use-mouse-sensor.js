// @flow
import type { Position } from 'css-box-model';
import { useEffect, useRef } from 'react';
import { useCallback, useMemo } from 'use-memo-one';
import type { SensorHookArgs } from '../sensor-types';
import type { EventBinding, EventOptions } from './util/event-types';
import { bindEvents, unbindEvents } from './util/bind-events';
import createScheduler from '../../use-drag-handle/util/create-scheduler';

// https://developer.mozilla.org/en-US/docs/Web/API/MouseEvent/button
const primaryButton: number = 0;
function noop() {}

export default function useMouseSensor(args: SensorHookArgs) {
  const { canStartCapturingFromEvent, onCaptureStart } = args;
  const unbindWindowEventsRef = useRef<() => void>(noop);

  const stop = useCallback(() => {}, []);

  const startPendingDrag = useCallback(
    function startPendingDrag(point: Position) {
      console.log('start pending drag');
      onCaptureStart(stop);
    },
    [onCaptureStart, stop],
  );

  const startCaptureBinding: EventBinding = useMemo(
    () => ({
      eventName: 'mousedown',
      fn: function onMouseDown(event: MouseEvent) {
        // only starting a drag if dragging with the primary mouse button
        if (event.button !== primaryButton) {
          return;
        }

        // Do not start a drag if any modifier key is pressed
        if (event.ctrlKey || event.metaKey || event.shiftKey || event.altKey) {
          return;
        }

        if (!canStartCapturingFromEvent(event)) {
          return;
        }

        event.preventDefault();

        const point: Position = {
          x: event.clientX,
          y: event.clientY,
        };

        // unbind this listener
        unbindWindowEventsRef.current();

        startPendingDrag(point);
      },
    }),
    [canStartCapturingFromEvent, startPendingDrag],
  );

  const listenForCapture = useCallback(
    function tryStartCapture() {
      const options: EventOptions = {
        passive: false,
        capture: true,
      };

      bindEvents(window, [startCaptureBinding], options);
      // setup unbind
      unbindWindowEventsRef.current = () =>
        unbindEvents(window, [startCaptureBinding], options);
    },
    [startCaptureBinding],
  );

  useEffect(() => {
    listenForCapture();

    // kill any pending window events when unmounting
    return () => {
      unbindWindowEventsRef.current();
    };
  }, [listenForCapture]);
}
