// @flow
import rafSchd from 'raf-schd';
import { useEffect } from 'react';
import { useCallback } from 'use-memo-one';
import type { Position } from 'css-box-model';
import type {
  ContextId,
  State,
  Sensor,
  SensorLift,
  StopDragOptions,
  PreDragActions,
  DragActions,
} from '../../types';
import {
  isClaimed,
  claim,
  isActive,
  type Lock,
  release,
  tryAbandon,
} from './lock';
import type { Store, Action } from '../../state/store-types';
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
import getBorderBoxCenterPosition from '../get-border-box-center-position';
import { warning } from '../../dev-warning';
import isHtmlElement from '../is-type-of-element/is-html-element';
import useKeyboardSensor from './sensors/use-keyboard-sensor';
import useLayoutEffect from '../use-isomorphic-layout-effect';

function preventDefault(event: Event) {
  event.preventDefault();
}

function noop() {}

type TryGetLockArgs = {|
  contextId: ContextId,
  store: Store,
  source: Event | Element,
  forceSensorStop: () => void,
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

function tryGetLock({
  contextId,
  store,
  source,
  forceSensorStop,
}: TryGetLockArgs): ?PreDragActions {
  // lock is already claimed - cannot start
  if (isClaimed()) {
    return null;
  }

  const target: ?Element = getTarget(source);

  // Must be a HTMLElement
  if (!isHtmlElement(target)) {
    warning('Expected target to be a HTMLElement');
    return null;
  }

  const handle: ?HTMLElement = getClosestDragHandle(contextId, target);

  // event did not contain a drag handle parent - cannot start
  if (handle == null) {
    return null;
  }

  const draggable: HTMLElement = getClosestDraggable(contextId, handle);
  const {
    id,
    shouldRespectForcePress,
    canDragInteractiveElements,
    isEnabled,
  } = getOptionsFromDraggable(draggable);

  // draggable is not enabled - cannot start
  if (!isEnabled) {
    return null;
  }

  // do not allow dragging from interactive elements
  if (
    !canDragInteractiveElements &&
    isHandleInInteractiveElement(draggable, handle)
  ) {
    return null;
  }

  // Application might now allow dragging right now
  if (!canStartDrag(store.getState(), id)) {
    return null;
  }

  // claiming lock
  const lock: Lock = claim(forceSensorStop);

  function abortPreDrag() {
    if (isActive(lock)) {
      release();
    }
  }

  function tryDispatch(getAction: () => Action): void {
    if (!isActive(lock)) {
      warning('Cannot perform action when no longer the owner of the lock');
      return;
    }
    store.dispatch(getAction());
  }

  function isLockActive() {
    return isActive(lock);
  }

  function getShouldRespectForcePress(): boolean {
    return shouldRespectForcePress;
  }

  function lift(args: SensorLift): DragActions {
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

    // Do lift operation
    tryDispatch(() => liftAction(actionArgs));

    // Setup DragActions
    const moveUp = () => tryDispatch(moveUpAction);
    const moveDown = () => tryDispatch(moveDownAction);
    const moveRight = () => tryDispatch(moveRightAction);
    const moveLeft = () => tryDispatch(moveLeftAction);

    const move = rafSchd((clientSelection: Position) => {
      tryDispatch(() => moveAction({ client: clientSelection }));
    });

    function finish(
      reason: 'CANCEL' | 'DROP',
      options?: StopDragOptions = { shouldBlockNextClick: false },
    ) {
      if (!isLockActive()) {
        warning('Cannot finish a drag when there is no lock');
        return;
      }

      // Cancel any pending request animation frames
      move.cancel();

      // block next click if requested
      if (options.shouldBlockNextClick) {
        window.addEventListener('click', preventDefault, {
          // only blocking a single click
          once: true,
          passive: false,
          capture: true,
        });
      }

      // releasing lock first so that a tryAbort will not run due to useEffect
      release();
      store.dispatch(dropAction({ reason }));
    }

    return {
      isActive: isLockActive,
      shouldRespectForcePress: getShouldRespectForcePress,
      move,
      moveUp,
      moveDown,
      moveRight,
      moveLeft,
      drop: (options?: StopDragOptions) => finish('DROP', options),
      cancel: (options?: StopDragOptions) => finish('CANCEL', options),
    };
  }

  const preDrag: PreDragActions = {
    isActive: isLockActive,
    shouldRespectForcePress: getShouldRespectForcePress,
    lift,
    abort: abortPreDrag,
  };

  return preDrag;
}

type SensorMarshalArgs = {|
  contextId: ContextId,
  store: Store,
  customSensors: ?(Sensor[]),
|};

const defaultSensors: Sensor[] = [useMouseSensor, useKeyboardSensor];

export default function useSensorMarshal({
  contextId,
  store,
  customSensors,
}: SensorMarshalArgs) {
  const useSensors: Sensor[] = [...defaultSensors, ...(customSensors || [])];

  // We need to abort any capturing if there is no longer a drag
  useEffect(
    function listenToStore() {
      let previous: State = store.getState();
      const unsubscribe = store.subscribe(() => {
        const current: State = store.getState();

        if (previous.isDragging && !current.isDragging) {
          tryAbandon();
        }

        previous = current;
      });

      // unsubscribe from store when unmounting
      return unsubscribe;
    },
    [store],
  );

  // abort any lock on unmount
  useLayoutEffect(() => {
    return tryAbandon;
  }, []);

  const wrapper = useCallback(
    (source: Event | Element, forceStop?: () => void = noop): ?PreDragActions =>
      tryGetLock({
        contextId,
        store,
        source,
        forceSensorStop: forceStop,
      }),
    [contextId, store],
  );

  // Bad ass
  useValidateSensorHooks(useSensors);
  for (let i = 0; i < useSensors.length; i++) {
    useSensors[i](wrapper);
  }
}
