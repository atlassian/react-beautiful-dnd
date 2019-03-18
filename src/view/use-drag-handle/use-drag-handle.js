// @flow
import { useLayoutEffect, useRef } from 'react';
import type {
  Sensor,
  CreateSensorArgs,
  MouseSensor,
  KeyboardSensor,
  TouchSensor,
} from './sensor/sensor-types';
import type { Args, DragHandleProps, Callbacks } from './drag-handle-types';
import { useConstant, useConstantFn } from '../use-constant';
import createKeyboardSensor from './sensor/create-keyboard-sensor';
import createTouchSensor from './sensor/create-touch-sensor';
import { warning } from '../../dev-warning';
import shouldAllowDraggingFromTarget from './util/should-allow-dragging-from-target';
import getWindowFromEl from '../window/get-window-from-el';
import useRequiredContext from '../use-required-context';
import AppContext, { type AppContextValue } from '../context/app-context';
import createMouseSensor from './sensor/create-mouse-sensor';

function preventHtml5Dnd(event: DragEvent) {
  event.preventDefault();
}

export default function useDragHandle(args: Args): DragHandleProps {
  const { canLift, style }: AppContextValue = useRequiredContext(AppContext);

  // side effect on every render
  const latestArgsRef = useRef<Args>(args);
  latestArgsRef.current = args;
  const getLatestArgs = useConstantFn(() => latestArgsRef.current);

  // TODO: things will go bad if getDraggableRef changes
  const getWindow = useConstantFn(
    (): HTMLElement => getWindowFromEl(getLatestArgs().getDraggableRef()),
  );

  const isFocusedRef = useRef<boolean>(false);
  const onFocus = useConstantFn(() => {
    isFocusedRef.current = true;
  });
  const onBlur = useConstantFn(() => {
    isFocusedRef.current = false;
  });

  const isAnySensorCapturing = useConstantFn(() =>
    // using getSensors before it is defined
    // eslint-disable-next-line no-use-before-define
    getSensors().some((sensor: Sensor): boolean => sensor.isCapturing()),
  );

  const canStartCapturing = useConstantFn((event: Event) => {
    // this might be before a drag has started - isolated to this element
    if (isAnySensorCapturing()) {
      return false;
    }

    // this will check if anything else in the system is dragging
    if (!canLift(getLatestArgs().draggableId)) {
      return false;
    }

    // check if we are dragging an interactive element
    return shouldAllowDraggingFromTarget(
      event,
      getLatestArgs().canDragInteractiveElements,
    );
  });

  const getCallbacks = useConstantFn(
    (): Callbacks => getLatestArgs().callbacks,
  );

  const createArgs: CreateSensorArgs = useConstant(() => ({
    getCallbacks,
    getDraggableRef: getLatestArgs().getDraggableRef,
    canStartCapturing,
    getWindow,
    getShouldRespectForceTouch: getLatestArgs().getShouldRespectForceTouch,
  }));

  const mouse: MouseSensor = useConstant(() => createMouseSensor(createArgs));
  const keyboard: KeyboardSensor = useConstant(() =>
    createKeyboardSensor(createArgs),
  );
  const touch: TouchSensor = useConstant(() => createTouchSensor(createArgs));
  const getSensors = useConstantFn(() => [mouse, keyboard, touch]);

  const onKeyDown = useConstantFn((event: KeyboardEvent) => {
    // let the other sensors deal with it
    if (mouse.isCapturing() || touch.isCapturing()) {
      return;
    }

    keyboard.onKeyDown(event);
  });

  const onMouseDown = useConstantFn((event: MouseEvent) => {
    // let the other sensors deal with it
    if (keyboard.isCapturing() || touch.isCapturing()) {
      return;
    }

    mouse.onMouseDown(event);
  });

  const onTouchStart = useConstantFn((event: TouchEvent) => {
    // let the keyboard sensor deal with it
    if (mouse.isCapturing() || keyboard.isCapturing()) {
      return;
    }

    touch.onTouchStart(event);
  });

  // TODO: focus retention
  useLayoutEffect(() => {});

  // Cleanup any capturing sensors when unmounting
  useLayoutEffect(() => {
    // Just a cleanup function
    return () => {
      getSensors().forEach((sensor: Sensor) => {
        // kill the current drag and fire a cancel event if
        const wasDragging: boolean = sensor.isDragging();

        sensor.unmount();
        // Cancel if drag was occurring
        if (wasDragging) {
          latestArgsRef.current.callbacks.onCancel();
        }
      });
    };
    // sensors is constant
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Checking for disabled changes during a drag
  useLayoutEffect(() => {
    getSensors().forEach((sensor: Sensor) => {
      if (!sensor.isCapturing()) {
        return;
      }
      const wasDragging: boolean = sensor.isDragging();
      sensor.kill();

      // It is fine for a draggable to be disabled while a drag is pending
      if (wasDragging) {
        warning(
          'You have disabled dragging on a Draggable while it was dragging. The drag has been cancelled',
        );
        getLatestArgs().callbacks.onCancel();
      }
    });
  }, [getLatestArgs, getSensors]);

  // Drag aborted elsewhere in application
  useLayoutEffect(() => {
    if (getLatestArgs().isDragging) {
      return;
    }

    getSensors().forEach((sensor: Sensor) => {
      if (sensor.isCapturing()) {
        sensor.kill();
      }
    });
  }, [getLatestArgs, getSensors]);

  const props: DragHandleProps = useConstant(() => ({
    onMouseDown,
    onKeyDown,
    onTouchStart,
    onFocus,
    onBlur,
    tabIndex: 0,
    'data-react-beautiful-dnd-drag-handle': style,
    // English default. Consumers are welcome to add their own start instruction
    'aria-roledescription': 'Draggable item. Press space bar to lift',
    draggable: false,
    onDragStart: preventHtml5Dnd,
  }));

  return props;
}
