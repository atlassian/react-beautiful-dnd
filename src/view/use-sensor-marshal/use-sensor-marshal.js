// @flow
import invariant from 'tiny-invariant';
import rafSchd from 'raf-schd';
import { useEffect } from 'react';
import { useCallback } from 'use-memo-one';
import type { Position } from 'css-box-model';
import type { ContextId, DraggableId, State } from '../../types';
import type { Store, Action } from '../../state/store-types';
import type {
  MovementCallbacks,
  SensorHook,
  CaptureEndOptions,
  OnLiftArgs,
} from './sensor-types';
import { getClosestDragHandle, getClosestDraggable } from './get-closest';
import canStartDrag from '../../state/can-start-drag';
import {
  move as moveAction,
  moveUp as moveUpAction,
  moveRight as moveRightAction,
  moveDown as moveDownAction,
  moveLeft as moveLeftAction,
  drop as dropAction,
  lift as liftAction,
} from '../../state/action-creators';
import useMouseSensor from './sensors/use-mouse-sensor';
import useValidateSensorHooks from './use-validate-sensor-hooks';
import isHandleInInteractiveElement from './is-handle-in-interactive-element';
import getOptionsFromDraggable from './get-options-from-draggable';
import useDemoSensor from '../../debug/use-demo-sensor';
import getBorderBoxCenterPosition from '../get-border-box-center-position';
import { warning } from '../../dev-warning';
import isHtmlElement from '../is-type-of-element/is-html-element';

type Capturing = {|
  id: DraggableId,
  abort: () => void,
|};

let capturing: ?Capturing = null;

function startCapture(id: DraggableId, abort: () => void) {
  invariant(!capturing, 'Cannot start capturing when already capturing');
  capturing = { id, abort };
}
function stopCapture() {
  invariant(capturing, 'Cannot stop capturing when not already capturing');
  capturing = null;
}

function preventDefault(event: Event) {
  event.preventDefault();
}

type TryStartCapturingArgs = {|
  contextId: ContextId,
  store: Store,
  source: Event | Element,
  abort: () => void,
|};

function getTarget(source: Event | Element): ?Element {
  if (source instanceof Element) {
    return source;
  }
  // source is an event

  // Event is already used: do not start a drag
  if (source.defaultPrevented) {
    return null;
  }

  // Only interested if the target is an Element
  const target: EventTarget = source.target;
  return target instanceof Element ? target : null;
}

function tryStartCapturing({
  contextId,
  store,
  source,
  abort,
}: TryStartCapturingArgs): ?MovementCallbacks {
  if (capturing != null) {
    return null;
  }

  const target: ?Element = getTarget(source);

  // Must be a HTMLElement
  if (!isHtmlElement(target)) {
    warning('Expected target to be a HTMLElement');
    return null;
  }

  const handle: ?HTMLElement = getClosestDragHandle(contextId, target);

  if (handle == null) {
    return null;
  }

  const draggable: HTMLElement = getClosestDraggable(contextId, handle);
  const {
    id,
    shouldRespectForcePress,
    canDragInteractiveElements,
  } = getOptionsFromDraggable(draggable);

  // do not allow dragging from interactive elements
  if (
    !canDragInteractiveElements &&
    isHandleInInteractiveElement(draggable, handle)
  ) {
    return null;
  }

  if (!canStartDrag(store.getState(), id)) {
    return null;
  }

  startCapture(id, abort);
  let isCapturing: boolean = true;

  function ifCapturing(maybe: Function) {
    if (isCapturing) {
      maybe();
      return;
    }
    warning(
      'Trying to perform operation when no longer responsible for capturing',
    );
  }

  const tryDispatch = (getAction: () => Action): void => {
    if (!isCapturing) {
      warning(
        'Trying to perform operation when no longer responsible for capturing',
      );
      return;
    }
    store.dispatch(getAction());
  };
  const moveUp = () => tryDispatch(moveUpAction);
  const moveDown = () => tryDispatch(moveDownAction);
  const moveRight = () => tryDispatch(moveRightAction);
  const moveLeft = () => tryDispatch(moveLeftAction);

  const move = rafSchd((clientSelection: Position) => {
    ifCapturing(() => store.dispatch(moveAction({ client: clientSelection })));
  });

  function lift(args: OnLiftArgs) {
    const actionArgs =
      args.mode === 'FLUID'
        ? {
            clientSelection: args.clientSelection,
            movementMode: 'FLUID',
            id,
          }
        : {
            movementMode: 'SNAP',
            clientSelection: getBorderBoxCenterPosition(draggable),
            id,
          };

    tryDispatch(() => liftAction(actionArgs));
  }

  const finish = (
    options?: CaptureEndOptions = { shouldBlockNextClick: false },
    action?: Action,
  ) => {
    if (!isCapturing) {
      warning('Cannot finish a drag when not capturing');
      return;
    }

    // stopping capture
    stopCapture();
    isCapturing = false;

    // block next click if requested
    if (options.shouldBlockNextClick) {
      window.addEventListener('click', preventDefault, {
        // only blocking a single click
        once: true,
        passive: false,
        capture: true,
      });
    }

    // cancel any pending request animation frames
    move.cancel();

    if (action) {
      store.dispatch(action);
    }
  };

  return {
    shouldRespectForcePress: (): boolean => shouldRespectForcePress,
    lift,
    move,
    moveUp,
    moveDown,
    moveRight,
    moveLeft,
    drop: (args?: CaptureEndOptions) => {
      finish(args, dropAction({ reason: 'DROP' }));
    },
    cancel: (args?: CaptureEndOptions) => {
      finish(args, dropAction({ reason: 'CANCEL' }));
    },
    abort: () => finish(),
  };
}

function tryAbortCapture() {
  if (capturing) {
    capturing.abort();
    capturing = null;
  }
}

type SensorMarshalArgs = {|
  contextId: ContextId,
  store: Store,
  useSensorHooks?: SensorHook[],
|};

export default function useSensorMarshal({
  contextId,
  store,
  useSensorHooks = [useMouseSensor /* useDemoSensor */],
}: SensorMarshalArgs) {
  // We need to abort any capturing if there is no longer a drag
  useEffect(
    function listen() {
      let previous: State = store.getState();
      const unsubscribe = store.subscribe(() => {
        const current: State = store.getState();

        if (previous.isDragging && !current.isDragging) {
          tryAbortCapture();
        }

        previous = current;
      });
      return unsubscribe;
    },
    [store],
  );

  const tryStartCapture = useCallback(
    (source: Event | Element, abort: () => void): ?MovementCallbacks =>
      tryStartCapturing({
        contextId,
        store,
        source,
        abort,
      }),
    [contextId, store],
  );

  // Bad ass
  useValidateSensorHooks(useSensorHooks);
  for (let i = 0; i < useSensorHooks.length; i++) {
    useSensorHooks[i](tryStartCapture);
  }
}
