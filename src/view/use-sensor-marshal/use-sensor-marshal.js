// @flow
import rafSchd from 'raf-schd';
import invariant from 'tiny-invariant';
import { useState } from 'react';
import { useCallback, useMemo } from 'use-memo-one';
import type { Position } from 'css-box-model';
import type {
  ContextId,
  State,
  Sensor,
  StopDragOptions,
  PreDragActions,
  FluidDragActions,
  SnapDragActions,
  DraggableId,
  SensorAPI,
  TryGetLock,
  TryGetLockOptions,
} from '../../types';
import create, { type Lock, type LockAPI } from './lock';
import type { Store, Action } from '../../state/store-types';
import tryGetDraggable from './try-get-draggable';
import canStartDrag from '../../state/can-start-drag';
import {
  move as moveAction,
  moveUp as moveUpAction,
  moveRight as moveRightAction,
  moveDown as moveDownAction,
  moveLeft as moveLeftAction,
  drop as dropAction,
  lift as liftAction,
  type LiftArgs as LiftActionArgs,
} from '../../state/action-creators';
import useMouseSensor from './sensors/use-mouse-sensor';
import useKeyboardSensor from './sensors/use-keyboard-sensor';
import useTouchSensor from './sensors/use-touch-sensor';
import useValidateSensorHooks from './use-validate-sensor-hooks';
import isEventInInteractiveElement from './is-event-in-interactive-element';
import getDataFromDraggable from './get-data-from-draggable';
import getBorderBoxCenterPosition from '../get-border-box-center-position';
import { warning } from '../../dev-warning';
import useLayoutEffect from '../use-isomorphic-layout-effect';
import { noop } from '../../empty';
import tryGetClosestDraggableIdFromEvent from './try-get-closest-draggable-id-from-event';

function preventDefault(event: Event) {
  event.preventDefault();
}

type LockPhase = 'PRE_DRAG' | 'DRAGGING' | 'COMPLETED';

type IsActiveArgs = {|
  expected: LockPhase,
  phase: LockPhase,
  isLockActive: () => boolean,
  shouldWarn: boolean,
|};

function isActive({
  expected,
  phase,
  isLockActive,
  shouldWarn,
}: IsActiveArgs): boolean {
  // lock is no longer active
  if (!isLockActive()) {
    if (shouldWarn) {
      warning(`
        Cannot perform action.
        The sensor no longer has an action lock.

        Tips:

        - Throw away your action handlers when forceStop() is called
        - Check actions.isActive() if you really need to
      `);
    }
    return false;
  }
  // wrong phase
  if (expected !== phase) {
    if (shouldWarn) {
      warning(`
        Cannot perform action.
        The actions you used belong to an outdated phase

        Current phase: ${expected}
        You called an action from outdated phase: ${phase}

        Tips:

        - Do not use preDragActions actions after calling preDragActions.lift()
      `);
    }
    return false;
  }
  return true;
}

type TryStartArgs = {|
  lockAPI: LockAPI,
  contextId: ContextId,
  store: Store,
  draggableId: DraggableId,
  forceSensorStop: ?() => void,
  sourceEvent: ?Event,
|};

function tryStart({
  lockAPI,
  contextId,
  store,
  draggableId,
  forceSensorStop,
  sourceEvent,
}: TryStartArgs): ?PreDragActions {
  // lock is already claimed - cannot start
  if (lockAPI.isClaimed()) {
    return null;
  }

  // TODO: can we get this from the dimension marshal?
  const draggable: ?HTMLElement = tryGetDraggable(contextId, draggableId);

  if (!draggable) {
    warning(`Unable to find draggable with id: ${draggableId}`);
    return null;
  }

  const {
    id,
    isEnabled,
    canDragInteractiveElements,
    shouldRespectForcePress,
  } = getDataFromDraggable(draggable);

  // draggable is not enabled - cannot start
  if (!isEnabled) {
    return null;
  }

  // do not allow dragging from interactive elements
  if (
    sourceEvent &&
    !canDragInteractiveElements &&
    isEventInInteractiveElement(draggable, sourceEvent)
  ) {
    return null;
  }

  // Application might now allow dragging right now
  if (!canStartDrag(store.getState(), id)) {
    return null;
  }

  // claiming lock
  const lock: Lock = lockAPI.claim(forceSensorStop || noop);
  let phase: LockPhase = 'PRE_DRAG';

  function getShouldRespectForcePress(): boolean {
    return shouldRespectForcePress;
  }

  function isLockActive(): boolean {
    return lockAPI.isActive(lock);
  }

  function tryDispatch(expected: LockPhase, getAction: () => Action): void {
    if (isActive({ expected, phase, isLockActive, shouldWarn: true })) {
      store.dispatch(getAction());
    }
  }

  const tryDispatchWhenDragging = tryDispatch.bind(this, 'DRAGGING');

  type LiftArgs = {|
    liftActionArgs: LiftActionArgs,
    cleanup: () => void,
    actions: Object,
  |};

  function lift(args: LiftArgs) {
    function completed() {
      lockAPI.release();
      phase = 'COMPLETED';
    }
    // Double lift = bad
    if (phase !== 'PRE_DRAG') {
      completed();
      invariant(phase === 'PRE_DRAG', `Cannot lift in phase ${phase}`);
    }

    store.dispatch(liftAction(args.liftActionArgs));

    // We are now in the DRAGGING phase
    phase = 'DRAGGING';

    function finish(
      reason: 'CANCEL' | 'DROP',
      options?: StopDragOptions = { shouldBlockNextClick: false },
    ) {
      args.cleanup();

      // block next click if requested
      if (options.shouldBlockNextClick) {
        window.addEventListener('click', preventDefault, {
          // only blocking a single click
          once: true,
          passive: false,
          capture: true,
        });
      }

      // releasing
      completed();
      store.dispatch(dropAction({ reason }));
    }

    return {
      isActive: () =>
        isActive({
          expected: 'DRAGGING',
          phase,
          isLockActive,
          // Do not want to want warnings for boolean checks
          shouldWarn: false,
        }),
      shouldRespectForcePress: getShouldRespectForcePress,
      drop: (options?: StopDragOptions) => finish('DROP', options),
      cancel: (options?: StopDragOptions) => finish('CANCEL', options),
      ...args.actions,
    };
  }

  function fluidLift(clientSelection: Position): FluidDragActions {
    const move = rafSchd((client: Position) => {
      tryDispatchWhenDragging(() => moveAction({ client }));
    });

    const api = lift({
      liftActionArgs: { id, clientSelection, movementMode: 'FLUID' },
      cleanup: () => move.cancel(),
      actions: { move },
    });

    return {
      ...api,
      move,
    };
  }

  function snapLift(): SnapDragActions {
    const actions = {
      moveUp: () => tryDispatchWhenDragging(moveUpAction),
      moveRight: () => tryDispatchWhenDragging(moveRightAction),
      moveDown: () => tryDispatchWhenDragging(moveDownAction),
      moveLeft: () => tryDispatchWhenDragging(moveLeftAction),
    };

    return lift({
      liftActionArgs: {
        id,
        clientSelection: getBorderBoxCenterPosition(draggable),
        movementMode: 'SNAP',
      },
      cleanup: noop,
      actions,
    });
  }

  function abortPreDrag() {
    const shouldRelease: boolean = isActive({
      expected: 'PRE_DRAG',
      phase,
      isLockActive,
      shouldWarn: true,
    });

    if (shouldRelease) {
      lockAPI.release();
    }
  }

  const preDrag: PreDragActions = {
    isActive: () =>
      isActive({
        expected: 'PRE_DRAG',
        phase,
        isLockActive,
        // Do not want to want warnings for boolean checks
        shouldWarn: false,
      }),
    shouldRespectForcePress: getShouldRespectForcePress,
    fluidLift,
    snapLift,
    abort: abortPreDrag,
  };

  return preDrag;
}

type SensorMarshalArgs = {|
  contextId: ContextId,
  store: Store,
  customSensors: ?(Sensor[]),
  enableDefaultSensors: boolean,
|};

const defaultSensors: Sensor[] = [
  useMouseSensor,
  useKeyboardSensor,
  useTouchSensor,
];

export default function useSensorMarshal({
  contextId,
  store,
  customSensors,
  enableDefaultSensors,
}: SensorMarshalArgs) {
  const useSensors: Sensor[] = [
    ...(enableDefaultSensors ? defaultSensors : []),
    ...(customSensors || []),
  ];
  const lockAPI: LockAPI = useState(() => create())[0];

  const tryAbandonLock = useCallback(
    function tryAbandonLock(previous: State, current: State) {
      if (previous.isDragging && !current.isDragging) {
        lockAPI.tryAbandon();
      }
    },
    [lockAPI],
  );

  // We need to abort any capturing if there is no longer a drag
  useLayoutEffect(
    function listenToStore() {
      let previous: State = store.getState();
      const unsubscribe = store.subscribe(() => {
        const current: State = store.getState();
        tryAbandonLock(previous, current);
        previous = current;
      });

      // unsubscribe from store when unmounting
      return unsubscribe;
    },
    [lockAPI, store, tryAbandonLock],
  );

  // abort any lock on unmount
  useLayoutEffect(() => {
    return lockAPI.tryAbandon;
  }, [lockAPI.tryAbandon]);

  const tryGetLock: TryGetLock = useCallback(
    (
      draggableId: DraggableId,
      forceStop?: () => void,
      options?: TryGetLockOptions,
    ): ?PreDragActions =>
      tryStart({
        lockAPI,
        contextId,
        store,
        draggableId,
        forceSensorStop: forceStop,
        sourceEvent:
          options && options.sourceEvent ? options.sourceEvent : null,
      }),
    [contextId, lockAPI, store],
  );

  const tryGetClosestDraggableId = useCallback(
    (event: Event): ?DraggableId =>
      tryGetClosestDraggableIdFromEvent(contextId, event),
    [contextId],
  );

  const api: SensorAPI = useMemo(
    () => ({
      tryGetLock,
      tryGetClosestDraggableId,
    }),
    [tryGetClosestDraggableId, tryGetLock],
  );

  // Bad ass
  useValidateSensorHooks(useSensors);
  for (let i = 0; i < useSensors.length; i++) {
    useSensors[i](api);
  }
}
