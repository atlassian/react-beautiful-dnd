// @flow
import invariant from 'tiny-invariant';
import { useEffect } from 'react';
import { useCallback, useMemo } from 'use-memo-one';
import type { Position } from 'css-box-model';
import type { DraggableId, MovementMode } from '../../types';
import type { Store } from '../../state/store-types';
import type { SensorHookArgs, SensorHook } from './sensor-types';
import getClosestDragHandle from './get-closest-drag-handle';
import canStartDrag from '../../state/can-start-drag';
import {
  move as moveAction,
  moveByWindowScroll as windowScrollAction,
  moveUp as moveUpAction,
  moveRight as moveRightAction,
  moveDown as moveDownAction,
  moveLeft as moveLeftAction,
  drop as dropAction,
  lift as liftAction,
  type LiftArgs,
} from '../../state/action-creators';
import getWindowScroll from '../window/get-window-scroll';
import useMouseSensor from './sensors/use-mouse-sensor';

let isCapturing: boolean = false;
function onCaptureStart() {
  invariant(!isCapturing, 'Cannot start capturing when already capturing');
  isCapturing = true;
}

function onCaptureEnd() {
  invariant(isCapturing, 'Cannot end capturing when not capturing');
  isCapturing = false;
}

export default function useSensorMarshal(
  contextId: string,
  store: Store,
  // TODO: expose ability to create own sensor :O
  useSensorHooks?: SensorHook[] = [useMouseSensor],
) {
  const canStartCapturing = useCallback(
    function canStartCapturing(id: DraggableId) {
      // Something else is capturing
      if (isCapturing) {
        return false;
      }

      // Application is allowing a drag to start
      return canStartDrag(store.getState(), id);
    },
    [store],
  );

  const canStartCapturingFromEvent = useCallback(
    function canStartCapturingFromEvent(event: Event): boolean {
      if (event.defaultPrevented) {
        console.log('already handled');
        return false;
      }

      const target: EventTarget = event.target;
      if (!(target instanceof HTMLElement)) {
        console.log('target is not a html element');
        return false;
      }

      const id: ?DraggableId = getClosestDragHandle(contextId, target);

      if (id == null) {
        return false;
      }

      return canStartCapturing(id);
    },
    [canStartCapturing, contextId],
  );

  const args: SensorHookArgs = useMemo(
    () => ({
      // Capturing
      canStartCapturing,
      canStartCapturingFromEvent,
      onCaptureStart,
      onCaptureEnd,

      // Movement
      onLift: (options: LiftArgs) => store.dispatch(liftAction(options)),
      onMove: (clientSelection: Position) =>
        store.dispatch(moveAction({ client: clientSelection })),
      onWindowScroll: () =>
        store.dispatch(
          windowScrollAction({
            newScroll: getWindowScroll(),
          }),
        ),
      onMoveUp: () => store.dispatch(moveUpAction()),
      onMoveDown: () => store.dispatch(moveDownAction()),
      onMoveRight: () => store.dispatch(moveRightAction()),
      onMoveLeft: () => store.dispatch(moveLeftAction()),
      onDrop: () => store.dispatch(dropAction({ reason: 'DROP' })),
      onCancel: () => store.dispatch(dropAction({ reason: 'CANCEL' })),
    }),
    [canStartCapturing, canStartCapturingFromEvent, store],
  );

  // TODO: validate length of sensor hooks has not changed from mount

  // Bad ass
  // eslint-disable-next-line react-hooks/rules-of-hooks
  useSensorHooks.forEach((useSensor: SensorHook) => useSensor(args));
}
