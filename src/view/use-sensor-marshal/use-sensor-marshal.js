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
  ActionLock,
  ReleaseLockOptions,
} from '../../types';
import { getLock, obtainLock, releaseLock, tryAbortLock } from './lock';
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
}: TryGetLockArgs): ?ActionLock {
  // there is already a lock - cannot start
  if (getLock() != null) {
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

  // TODO: what if a sensor does not call .abort
  let hasLock: boolean = true;

  function ifHasLock(maybe: Function) {
    if (hasLock) {
      maybe();
      return;
    }
    warning(
      'Trying to perform operation when no longer owner of sensor action lock',
    );
  }

  function tryDispatch(getAction: () => Action): void {
    if (!hasLock) {
      warning(
        'Trying to perform operation when no longer responsible for capturing',
      );
      return;
    }
    store.dispatch(getAction());
  }
  const moveUp = () => tryDispatch(moveUpAction);
  const moveDown = () => tryDispatch(moveDownAction);
  const moveRight = () => tryDispatch(moveRightAction);
  const moveLeft = () => tryDispatch(moveLeftAction);

  const move = rafSchd((clientSelection: Position) => {
    ifHasLock(() => store.dispatch(moveAction({ client: clientSelection })));
  });

  function lift(args: SensorLift) {
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

  function finish(
    options?: ReleaseLockOptions = { shouldBlockNextClick: false },
    action?: Action,
  ) {
    if (!hasLock) {
      warning('Cannot finish a drag when there is no lock');
      return;
    }

    // cancel any pending request animation frames
    move.cancel();

    // release the lock and record that we no longer have it
    hasLock = false;
    releaseLock();

    // block next click if requested
    if (options.shouldBlockNextClick) {
      window.addEventListener('click', preventDefault, {
        // only blocking a single click
        once: true,
        passive: false,
        capture: true,
      });
    }

    if (action) {
      store.dispatch(action);
    }
  }

  obtainLock(id, function abort() {
    forceSensorStop();
    finish();
  });

  return {
    shouldRespectForcePress: (): boolean => shouldRespectForcePress,
    lift,
    move,
    moveUp,
    moveDown,
    moveRight,
    moveLeft,
    drop: (args?: ReleaseLockOptions) => {
      finish(args, dropAction({ reason: 'DROP' }));
    },
    cancel: (args?: ReleaseLockOptions) => {
      finish(args, dropAction({ reason: 'CANCEL' }));
    },
    abort: () => finish(),
  };
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
          tryAbortLock();
        }

        previous = current;
      });

      return unsubscribe;
    },
    [store],
  );

  // abort any captures on unmount
  useLayoutEffect(() => {
    return tryAbortLock;
  }, []);

  const wrapper = useCallback(
    (source: Event | Element, forceStop?: () => void = noop): ?ActionLock =>
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
