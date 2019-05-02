// @flow
import invariant from 'tiny-invariant';
import { useEffect } from 'react';
import rafSchd from 'raf-schd';
import { useCallback, useMemo } from 'use-memo-one';
import type { Position } from 'css-box-model';
import type { DraggableId, MovementMode } from '../../types';
import type { Store } from '../../state/store-types';
import type { MovementCallbacks, SensorHook } from './sensor-types';
import getClosestDragHandle, {
  getDraggableId,
} from './get-closest-drag-handle';
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
import useValidateSensorHooks from './use-validate-sensor-hooks';

let capturingFor: ?DraggableId = null;
function startCapture(id: DraggableId) {
  invariant(!capturingFor, 'Cannot start capturing when already capturing');
  capturingFor = id;
}
function stopCapture() {
  invariant(capturingFor, 'Cannot stop capturing when not already capturing');
  capturingFor = null;
}

function tryStartCapturing(
  contextId: string,
  store: Store,
  event: Event,
): ?MovementCallbacks {
  if (capturingFor != null) {
    return null;
  }

  if (event.defaultPrevented) {
    return null;
  }

  const target: EventTarget = event.target;
  if (!(target instanceof HTMLElement)) {
    return null;
  }

  const id: ?DraggableId = getClosestDragHandle(contextId, target);

  if (id == null) {
    return null;
  }

  if (!canStartDrag(store.getState(), id)) {
    return null;
  }

  startCapture(id);

  const onMove = rafSchd((clientSelection: Position) => {
    store.dispatch(moveAction({ client: clientSelection }));
  });
  const onWindowScroll = rafSchd(() => {
    store.dispatch(
      windowScrollAction({
        newScroll: getWindowScroll(),
      }),
    );
  });
  const onMoveUp = rafSchd(() => {
    store.dispatch(moveUpAction());
  });
  const onMoveDown = rafSchd(() => {
    store.dispatch(moveDownAction());
  });
  const onMoveRight = rafSchd(() => {
    store.dispatch(moveRightAction());
  });
  const onMoveLeft = rafSchd(() => {
    store.dispatch(moveLeftAction());
  });
  const finish = () => {
    // stopping capture
    stopCapture();

    // cancel any pending request animation frames
    onMove.cancel();
    onWindowScroll.cancel();
    onMoveUp.cancel();
    onMoveRight.cancel();
    onMoveDown.cancel();
    onMoveLeft.cancel();
  };

  return {
    onLift: (options: {
      clientSelection: Position,
      movementMode: MovementMode,
    }) => {
      store.dispatch(
        liftAction({
          ...options,
          id,
        }),
      );
    },
    onMove,
    onWindowScroll,
    onMoveUp,
    onMoveDown,
    onMoveRight,
    onMoveLeft,
    onDrop: () => {
      finish();
      store.dispatch(dropAction({ reason: 'DROP' }));
    },
    onCancel: () => {
      finish();
      store.dispatch(dropAction({ reason: 'CANCEL' }));
    },
    onAbort: finish,
  };
}

export default function useSensorMarshal(
  contextId: string,
  store: Store,
  // TODO: expose ability to create own sensor :O
  useSensorHooks?: SensorHook[] = [useMouseSensor],
) {
  const tryStartCapture = useCallback(
    (event: Event): ?MovementCallbacks =>
      tryStartCapturing(contextId, store, event),
    [contextId, store],
  );

  // TODO: validate length of sensor hooks has not changed from mount

  // Bad ass
  useValidateSensorHooks(useSensorHooks);
  for (let i = 0; i < useSensorHooks.length; i++) {
    useSensorHooks[i](tryStartCapture);
  }
}
