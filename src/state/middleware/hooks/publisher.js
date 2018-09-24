// @flow
import invariant from 'tiny-invariant';
import messagePreset from '../util/message-preset';
import * as timings from '../../../debug/timings';
import getExpiringAnnounce from './expiring-announce';
import getFlushableFrame, { type FlushableFrame } from './flushable-frame';
import type {
  DropResult,
  Hooks,
  HookProvided,
  Critical,
  DragImpact,
  DraggableLocation,
  Combine,
  DragStart,
  Announce,
  DragUpdate,
  OnBeforeDragStartHook,
  OnDragStartHook,
  OnDragUpdateHook,
  OnDragEndHook,
} from '../../../types';
import { isCombineEqual, isCriticalEqual, areLocationsEqual } from './is-equal';

const withTimings = (key: string, fn: Function) => {
  timings.start(key);
  fn();
  timings.finish(key);
};

const getDragStart = (critical: Critical): DragStart => ({
  draggableId: critical.draggable.id,
  type: critical.droppable.type,
  source: {
    droppableId: critical.droppable.id,
    index: critical.draggable.index,
  },
});

type AnyPrimaryHookFn = OnDragStartHook | OnDragUpdateHook | OnDragEndHook;
type AnyHookData = DragStart | DragUpdate | DropResult;

const execute = (
  hook: ?AnyPrimaryHookFn,
  data: AnyHookData,
  announce: Announce,
  getDefaultMessage: (data: any) => string,
) => {
  if (!hook) {
    announce(getDefaultMessage(data));
    return;
  }

  const willExpire: Announce = getExpiringAnnounce(announce);
  const provided: HookProvided = {
    announce: willExpire,
  };

  // Casting because we are not validating which data type is going into which hook
  hook((data: any), provided);

  if (!willExpire.wasCalled()) {
    announce(getDefaultMessage(data));
  }
};

export default (getHooks: () => Hooks, announce: Announce) => {
  let lastLocation: ?DraggableLocation = null;
  let lastCombine: ?Combine = null;
  let lastCritical: ?Critical = null;
  let isDragStartPublished: boolean = false;
  let flushableStart: ?FlushableFrame = null;

  const tryFlushStart = () => {
    if (!flushableStart) {
      return;
    }

    flushableStart.flush();
    flushableStart = null;
  };

  const beforeStart = (critical: Critical) => {
    invariant(
      !isDragStartPublished,
      'Cannot fire onBeforeDragStart as a drag start has already been published',
    );
    withTimings('onBeforeDragStart', () => {
      // No use of screen reader for this hook
      const fn: ?OnBeforeDragStartHook = getHooks().onBeforeDragStart;
      if (fn) {
        fn(getDragStart(critical));
      }
    });
  };

  const start = (critical: Critical) => {
    invariant(
      !isDragStartPublished,
      'Cannot fire onBeforeDragStart as a drag start has already been published',
    );
    const data: DragStart = getDragStart(critical);
    lastCritical = critical;
    lastLocation = data.source;
    lastCombine = null;
    // letting consumers know publish has started
    // even though it could take up to a frame to happen
    isDragStartPublished = true;

    // we will flush this frame if we receive any hook updates
    flushableStart = getFlushableFrame(() => {
      withTimings('onDragStart', () =>
        execute(
          getHooks().onDragStart,
          data,
          announce,
          messagePreset.onDragStart,
        ),
      );
    });
  };

  // Passing in the critical location again as it can change during a drag
  const move = (critical: Critical, impact: DragImpact) => {
    tryFlushStart();
    const location: ?DraggableLocation = impact.destination;
    const combine: ?Combine = impact.merge ? impact.merge.combine : null;
    invariant(
      isDragStartPublished && lastCritical,
      'Cannot fire onDragMove when onDragStart has not been called',
    );

    // Has the critical changed? Will result in a source change
    const hasCriticalChanged: boolean = !isCriticalEqual(
      critical,
      lastCritical,
    );
    if (hasCriticalChanged) {
      lastCritical = critical;
    }

    // Has the location changed? Will result in a destination change
    const hasLocationChanged: boolean = !areLocationsEqual(
      lastLocation,
      location,
    );
    if (hasLocationChanged) {
      lastLocation = location;
    }
    const hasGroupingChanged: boolean = !isCombineEqual(lastCombine, combine);
    if (hasGroupingChanged) {
      lastCombine = combine;
    }

    // Nothing has changed - no update needed
    if (!hasCriticalChanged && !hasLocationChanged && !hasGroupingChanged) {
      return;
    }

    const data: DragUpdate = {
      ...getDragStart(critical),
      combine,
      destination: location,
    };

    withTimings('onDragUpdate', () =>
      execute(
        getHooks().onDragUpdate,
        data,
        announce,
        messagePreset.onDragUpdate,
      ),
    );
  };

  const drop = (result: DropResult) => {
    tryFlushStart();
    invariant(
      isDragStartPublished,
      'Cannot fire onDragEnd when there is no matching onDragStart',
    );
    isDragStartPublished = false;
    lastLocation = null;
    lastCritical = null;
    lastCombine = null;
    withTimings('onDragEnd', () =>
      execute(getHooks().onDragEnd, result, announce, messagePreset.onDragEnd),
    );
  };

  // A non user initiated cancel
  const abort = () => {
    tryFlushStart();
    invariant(
      isDragStartPublished && lastCritical,
      'Cannot cancel when onDragStart not fired',
    );

    const result: DropResult = {
      ...getDragStart(lastCritical),
      combine: null,
      destination: null,
      reason: 'CANCEL',
    };
    drop(result);
  };

  return {
    beforeStart,
    start,
    move,
    drop,
    abort,
    isDragStartPublished: (): boolean => isDragStartPublished,
  };
};
