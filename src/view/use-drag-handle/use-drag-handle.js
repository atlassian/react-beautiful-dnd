// @flow
import { useLayoutEffect, useRef, useMemo, useCallback } from 'react';
import type { Args, DragHandleProps, Callbacks } from './drag-handle-types';
import getWindowFromEl from '../window/get-window-from-el';
import useRequiredContext from '../use-required-context';
import AppContext, { type AppContextValue } from '../context/app-context';
import useMouseSensor, {
  type Args as MouseSensorArgs,
} from './sensor/use-mouse-sensor';

function preventHtml5Dnd(event: DragEvent) {
  event.preventDefault();
}

export default function useDragHandle(args: Args): DragHandleProps {
  const { canLift, style: styleContext }: AppContextValue = useRequiredContext(
    AppContext,
  );
  const { callbacks, getDraggableRef, getShouldRespectForceTouch } = args;

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

  const mouseArgs: MouseSensorArgs = useMemo(
    () => ({
      callbacks,
      getDraggableRef,
      getWindow,
      canStartCapturing: () => true,
      getShouldRespectForceTouch,
    }),
    [callbacks, getDraggableRef, getShouldRespectForceTouch, getWindow],
  );

  const onMouseDown = useMouseSensor(mouseArgs);

  const props: DragHandleProps = useMemo(
    () => ({
      onMouseDown,
      // TODO
      onKeyDown: () => {},
      onTouchStart: () => {},
      onFocus,
      onBlur,
      tabIndex: 0,
      'data-react-beautiful-dnd-drag-handle': styleContext,
      // English default. Consumers are welcome to add their own start instruction
      'aria-roledescription': 'Draggable item. Press space bar to lift',
      draggable: false,
      onDragStart: preventHtml5Dnd,
    }),
    [onBlur, onFocus, onMouseDown, styleContext],
  );

  return props;
}
