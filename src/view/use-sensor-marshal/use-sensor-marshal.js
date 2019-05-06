// @flow
import invariant from 'tiny-invariant';
import rafSchd from 'raf-schd';
import { useCallback } from 'use-memo-one';
import type { Position } from 'css-box-model';
import type { ContextId, DraggableId } from '../../types';
import type { Store } from '../../state/store-types';
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

let capturingFor: ?DraggableId = null;
function startCapture(id: DraggableId) {
  invariant(!capturingFor, 'Cannot start capturing when already capturing');
  capturingFor = id;
}
function stopCapture() {
  invariant(capturingFor, 'Cannot stop capturing when not already capturing');
  capturingFor = null;
}

function preventDefault(event: Event) {
  event.preventDefault();
}

type TryStartCapturingArgs = {|
  contextId: ContextId,
  store: Store,
  source: Event | Element,
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
}: TryStartCapturingArgs): ?MovementCallbacks {
  if (capturingFor != null) {
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

  startCapture(id);

  const move = rafSchd((clientSelection: Position) => {
    store.dispatch(moveAction({ client: clientSelection }));
  });
  const moveUp = () => {
    store.dispatch(moveUpAction());
  };
  const moveDown = () => {
    store.dispatch(moveDownAction());
  };
  const moveRight = () => {
    store.dispatch(moveRightAction());
  };
  const moveLeft = () => {
    store.dispatch(moveLeftAction());
  };
  const finish = (
    options?: CaptureEndOptions = { shouldBlockNextClick: false },
  ) => {
    // stopping capture
    stopCapture();

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
  };

  return {
    shouldRespectForcePress: (): boolean => shouldRespectForcePress,
    lift: (args: OnLiftArgs) => {
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

      store.dispatch(liftAction(actionArgs));
    },
    move,
    moveUp,
    moveDown,
    moveRight,
    moveLeft,
    drop: (args?: CaptureEndOptions) => {
      finish(args);
      store.dispatch(dropAction({ reason: 'DROP' }));
    },
    cancel: (args?: CaptureEndOptions) => {
      finish(args);
      store.dispatch(dropAction({ reason: 'CANCEL' }));
    },
    abort: () => finish(),
  };
}

type SensorMarshalArgs = {|
  contextId: ContextId,
  store: Store,
  useSensorHooks?: SensorHook[],
|};

export default function useSensorMarshal({
  contextId,
  store,
  useSensorHooks = [useMouseSensor /*useDemoSensor */],
}: SensorMarshalArgs) {
  const tryStartCapture = useCallback(
    (source: Event | Element): ?MovementCallbacks =>
      tryStartCapturing({
        contextId,
        store,
        source,
      }),
    [contextId, store],
  );

  // Bad ass
  useValidateSensorHooks(useSensorHooks);
  for (let i = 0; i < useSensorHooks.length; i++) {
    useSensorHooks[i](tryStartCapture);
  }
}
