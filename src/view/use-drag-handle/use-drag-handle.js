// @flow
import invariant from 'tiny-invariant';
import { useLayoutEffect, useRef, useMemo, useCallback } from 'react';
import type { Args, DragHandleProps } from './drag-handle-types';
import getWindowFromEl from '../window/get-window-from-el';
import useRequiredContext from '../use-required-context';
import AppContext, { type AppContextValue } from '../context/app-context';
import useMouseSensor, {
  type Args as MouseSensorArgs,
} from './sensor/use-mouse-sensor';
import shouldAllowDraggingFromTarget from './util/should-allow-dragging-from-target';
import useKeyboardSensor, {
  type Args as KeyboardSensorArgs,
} from './sensor/use-keyboard-sensor';
import useTouchSensor, {
  type Args as TouchSensorArgs,
} from './sensor/use-touch-sensor';
import usePreviousRef from '../use-previous-ref';

function preventHtml5Dnd(event: DragEvent) {
  event.preventDefault();
}

type Capturing = {|
  abort: () => void,
|};

export default function useDragHandle(args: Args): DragHandleProps {
  // Capturing
  const capturingRef = useRef<?Capturing>(null);
  const onCaptureStart = useCallback((abort: () => void) => {
    invariant(
      !capturingRef.current,
      'Cannot start capturing while something else is',
    );
    capturingRef.current = {
      abort,
    };
  }, []);
  const onCaptureEnd = useCallback(() => {
    invariant(
      capturingRef.current,
      'Cannot stop capturing while nothing is capturing',
    );
    capturingRef.current = null;
  }, []);
  const abortCapture = useCallback(() => {
    invariant(capturingRef.current, 'Cannot abort capture when there is none');
    capturingRef.current.abort();
  }, []);

  const { canLift, style: styleContext }: AppContextValue = useRequiredContext(
    AppContext,
  );
  const {
    isDragging,
    isEnabled,
    draggableId,
    callbacks,
    getDraggableRef,
    getShouldRespectForceTouch,
    canDragInteractiveElements,
  } = args;

  const getWindow = useCallback(
    (): HTMLElement => getWindowFromEl(getDraggableRef()),
    [getDraggableRef],
  );

  const isFocusedRef = useRef<boolean>(false);
  const onFocus = useCallback(() => {
    isFocusedRef.current = true;
  }, []);
  const onBlur = useCallback(() => {
    isFocusedRef.current = false;
  }, []);

  const canStartCapturing = useCallback(
    (event: Event) => {
      // Cannot lift when disabled
      if (!isEnabled) {
        return false;
      }
      // Something on this element might be capturing but a drag has not started yet
      // We want to prevent anything else from capturing
      if (capturingRef.current) {
        return false;
      }

      // Do not drag if anything else in the system is dragging
      if (!canLift(draggableId)) {
        return false;
      }

      // Check if we are dragging an interactive element
      return shouldAllowDraggingFromTarget(event, canDragInteractiveElements);
    },
    [canDragInteractiveElements, canLift, draggableId, isEnabled],
  );

  const mouseArgs: MouseSensorArgs = useMemo(
    () => ({
      callbacks,
      getDraggableRef,
      getWindow,
      canStartCapturing,
      onCaptureStart,
      onCaptureEnd,
      getShouldRespectForceTouch,
    }),
    [
      callbacks,
      getDraggableRef,
      getWindow,
      canStartCapturing,
      onCaptureStart,
      onCaptureEnd,
      getShouldRespectForceTouch,
    ],
  );
  const onMouseDown = useMouseSensor(mouseArgs);

  const keyboardArgs: KeyboardSensorArgs = useMemo(
    () => ({
      callbacks,
      getDraggableRef,
      getWindow,
      canStartCapturing,
      onCaptureStart,
      onCaptureEnd,
    }),
    [
      callbacks,
      canStartCapturing,
      getDraggableRef,
      getWindow,
      onCaptureEnd,
      onCaptureStart,
    ],
  );
  const onKeyDown = useKeyboardSensor(keyboardArgs);

  const touchArgs: TouchSensorArgs = useMemo(
    () => ({
      callbacks,
      getDraggableRef,
      getWindow,
      canStartCapturing,
      getShouldRespectForceTouch,
      onCaptureStart,
      onCaptureEnd,
    }),
    [
      callbacks,
      getDraggableRef,
      getWindow,
      canStartCapturing,
      getShouldRespectForceTouch,
      onCaptureStart,
      onCaptureEnd,
    ],
  );
  const onTouchStart = useTouchSensor(touchArgs);

  // aborting on unmount
  const lastArgsRef = usePreviousRef(args);
  useLayoutEffect(() => {
    // only when unmounting
    return () => {
      if (!capturingRef.current) {
        return;
      }
      abortCapture();

      if (lastArgsRef.current.isDragging) {
        // eslint-disable-next-line react-hooks/exhaustive-deps
        lastArgsRef.current.callbacks.onCancel();
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // handle aborting
  // No longer dragging but still capturing: need to abort
  if (!isDragging && capturingRef.current) {
    abortCapture();
  }

  // No longer enabled but still capturing: need to abort and cancel if needed
  if (!isEnabled && capturingRef.current) {
    abortCapture();
    if (isDragging) {
      callbacks.onCancel();
    }
  }

  const props: DragHandleProps = useMemo(
    () => ({
      onMouseDown,
      onKeyDown,
      onTouchStart,
      onFocus,
      onBlur,
      tabIndex: 0,
      'data-react-beautiful-dnd-drag-handle': styleContext,
      // English default. Consumers are welcome to add their own start instruction
      'aria-roledescription': 'Draggable item. Press space bar to lift',
      // Opting out of html5 drag and drops
      draggable: false,
      onDragStart: preventHtml5Dnd,
    }),
    [onBlur, onFocus, onKeyDown, onMouseDown, onTouchStart, styleContext],
  );

  return props;
}
