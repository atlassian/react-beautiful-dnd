// @flow
import invariant from 'tiny-invariant';
import { useEffect } from 'react';
import { useCallback, useMemo } from 'use-memo-one';
import type { Position } from 'css-box-model';
import type { DraggableId, MovementMode } from '../../types';
import type { Store } from '../../state/store-types';
import type { Phase, SensorHook } from './sensor-types';
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

let capturingFor: ?DraggableId = null;
function startCapture(id: DraggableId) {
  invariant(!capturingFor, 'Cannot start capturing when already capturing');
  capturingFor = id;
}
function stopCapture() {
  invariant(capturingFor, 'Cannot stop capturing when not already capturing');
  capturingFor = null;
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
      if (capturingFor != null) {
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

  const tryStartCapturing = useCallback(
    function tryStartCapturing(event: Event): boolean {
      if (capturingFor != null) {
        return false;
      }

      if (event.defaultPrevented) {
        return false;
      }

      const target: EventTarget = event.target;
      if (!(target instanceof HTMLElement)) {
        return false;
      }

      const id: ?DraggableId = getClosestDragHandle(contextId, target);

      if (id == null) {
        return false;
      }

      if (!canStartDrag(store.getState(), id)) {
        return false;
      }

      startCapture(id);
      return true;
    },
    [contextId, store],
  );

  const getPhase = useCallback(
    function getPhase(): Phase {
      if (capturingFor == null) {
        return {
          type: 'IDLE',
          callbacks: {
            tryStartCapturing,
          },
        };
      }

      return {
        type: 'CAPTURING',
        callbacks: {
          getDragHandleRef: () => null,
          getDraggableRef: () => null,
          onLift: (options: LiftArgs) => store.dispatch(liftAction(options)),
          onMove: (clientSelection: Position) =>
            store.dispatch(moveAction({ client: clientSelection })),
          onWindowScroll: () => {
            store.dispatch(
              windowScrollAction({
                newScroll: getWindowScroll(),
              }),
            );
          },
          onMoveUp: () => {
            store.dispatch(moveUpAction());
          },
          onMoveDown: () => {
            store.dispatch(moveDownAction());
          },
          onMoveRight: () => {
            store.dispatch(moveRightAction());
          },
          onMoveLeft: () => {
            store.dispatch(moveLeftAction());
          },
          onDrop: () => {
            stopCapture();
            store.dispatch(dropAction({ reason: 'DROP' }));
          },
          onCancel: () => {
            stopCapture();
            store.dispatch(dropAction({ reason: 'CANCEL' }));
          },
        },
      };
    },
    [store, tryStartCapturing],
  );

  // TODO: validate length of sensor hooks has not changed from mount

  // Bad ass
  // eslint-disable-next-line react-hooks/rules-of-hooks
  useSensorHooks.forEach((useSensor: SensorHook) => useSensor(getPhase));
}
