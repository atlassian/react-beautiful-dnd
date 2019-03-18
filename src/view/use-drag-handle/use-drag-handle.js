// @flow
import { useState, useRef, useEffect, useLayoutEffect } from 'react';
import { useConstantFn } from '../use-constant';
import type { Args, DragHandleProps } from './drag-handle-types';
import createKeyboardSensor from './sensor/create-keyboard-sensor';
import createTouchSensor from './sensor/create-touch-sensor';

export default function useDragHandle(args: Args): DragHandleProps {
  const isFocusedRef = useRef<boolean>(false);
  const setFocus = useConstantFn((value: boolean) => {
    isFocusedRef.current = value;
  });

  const createArgs = {
    setFocus,
  };

  const mouse: MouseSensor = useConstant(() => createMouseSensor(createArgs));
  const keyboard: KeyboardSensor = useConstant(() => createKeyboardSensor());
  const touch: TouchSensor = useConstant(() => createTouchSensor(createArgs));
  const sensors: Sensor[] = useConstant(() => [mouse, keyboard, touch]);

  // TODO: focus retention
  useLayoutEffect(() => {});

  // Cleanup any sensors
  useLayoutEffect(() => {
    () => {
      sensors.forEach((sensor: Sensor) => {
        // kill the current drag and fire a cancel event if
        const wasDragging: boolean = sensor.isDragging();

        sensor.unmount();
        // cancel if drag was occurring
        if (wasDragging) {
          callbacks.onCancel();
        }
      });
    };
    // sensors is constant
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
}
