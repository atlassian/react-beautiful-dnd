// @flow
import invariant from 'tiny-invariant';
import messagePreset from '../util/screen-reader-message-preset';
import * as timings from '../../../debug/timings';
import getExpiringAnnounce from './expiring-announce';
import getAsyncMarshal, { type AsyncMarshal } from './async-marshal';
import type {
  DropResult,
  Handles,
  HandleProvided,
  Critical,
  DragImpact,
  DraggableLocation,
  Combine,
  DragStart,
  Announce,
  DragUpdate,
  MovementMode,
  OnBeforeDragStartHandle,
  OnDragStartHandle,
  OnDragUpdateHandle,
  OnDragEndHandle,
} from '../../../types';
import { isCombineEqual, isCriticalEqual, areLocationsEqual } from './is-equal';

const withTimings = (key: string, fn: Function) => {
  timings.start(key);
  fn();
  timings.finish(key);
};

const getDragStart = (critical: Critical, mode: MovementMode): DragStart => ({
  draggableId: critical.draggable.id,
  type: critical.droppable.type,
  source: {
    droppableId: critical.droppable.id,
    index: critical.draggable.index,
  },
  mode,
});

type AnyPrimaryHandleFn =
  | OnDragStartHandle
  | OnDragUpdateHandle
  | OnDragEndHandle;
type AnyHandleData = DragStart | DragUpdate | DropResult;

const execute = (
  handle: ?AnyPrimaryHandleFn,
  data: AnyHandleData,
  announce: Announce,
  getDefaultMessage: (data: any) => string,
) => {
  if (!handle) {
    announce(getDefaultMessage(data));
    return;
  }

  const willExpire: Announce = getExpiringAnnounce(announce);
  const provided: HandleProvided = {
    announce: willExpire,
  };

  // Casting because we are not validating which data type is going into which handle
  handle((data: any), provided);

  if (!willExpire.wasCalled()) {
    announce(getDefaultMessage(data));
  }
};

type WhileDragging = {|
  mode: MovementMode,
  lastCritical: Critical,
  lastCombine: ?Combine,
  lastLocation: ?DraggableLocation,
|};

export default (getHandles: () => Handles, announce: Announce) => {
  const asyncMarshal: AsyncMarshal = getAsyncMarshal();
  let dragging: ?WhileDragging = null;

  const beforeStart = (critical: Critical, mode: MovementMode) => {
    invariant(
      !dragging,
      'Cannot fire onBeforeDragStart as a drag start has already been published',
    );
    withTimings('onBeforeDragStart', () => {
      // No use of screen reader for this handle
      const fn: ?OnBeforeDragStartHandle = getHandles().onBeforeDragStart;
      if (fn) {
        fn(getDragStart(critical, mode));
      }
    });
  };

  const start = (critical: Critical, mode: MovementMode) => {
    invariant(
      !dragging,
      'Cannot fire onBeforeDragStart as a drag start has already been published',
    );
    const data: DragStart = getDragStart(critical, mode);
    dragging = {
      mode,
      lastCritical: critical,
      lastLocation: data.source,
      lastCombine: null,
    };

    // we will flush this frame if we receive any handle updates
    asyncMarshal.add(() => {
      withTimings('onDragStart', () =>
        execute(
          getHandles().onDragStart,
          data,
          announce,
          messagePreset.onDragStart,
        ),
      );
    });
  };

  // Passing in the critical location again as it can change during a drag
  const update = (critical: Critical, impact: DragImpact) => {
    const location: ?DraggableLocation = impact.destination;
    const combine: ?Combine = impact.merge ? impact.merge.combine : null;
    invariant(
      dragging,
      'Cannot fire onDragMove when onDragStart has not been called',
    );

    // Has the critical changed? Will result in a source change
    const hasCriticalChanged: boolean = !isCriticalEqual(
      critical,
      dragging.lastCritical,
    );
    if (hasCriticalChanged) {
      dragging.lastCritical = critical;
    }

    // Has the location changed? Will result in a destination change
    const hasLocationChanged: boolean = !areLocationsEqual(
      dragging.lastLocation,
      location,
    );
    if (hasLocationChanged) {
      dragging.lastLocation = location;
    }
    const hasGroupingChanged: boolean = !isCombineEqual(
      dragging.lastCombine,
      combine,
    );
    if (hasGroupingChanged) {
      dragging.lastCombine = combine;
    }

    // Nothing has changed - no update needed
    if (!hasCriticalChanged && !hasLocationChanged && !hasGroupingChanged) {
      return;
    }

    const data: DragUpdate = {
      ...getDragStart(critical, dragging.mode),
      combine,
      destination: location,
    };

    asyncMarshal.add(() => {
      withTimings('onDragUpdate', () =>
        execute(
          getHandles().onDragUpdate,
          data,
          announce,
          messagePreset.onDragUpdate,
        ),
      );
    });
  };

  const flush = () => {
    invariant(dragging, 'Can only flush handles while dragging');
    asyncMarshal.flush();
  };

  const drop = (result: DropResult) => {
    invariant(
      dragging,
      'Cannot fire onDragEnd when there is no matching onDragStart',
    );
    dragging = null;
    // not adding to frame marshal - we want this to be done in the same render pass
    // we also want the consumers reorder logic to be in the same render pass
    withTimings('onDragEnd', () =>
      execute(
        getHandles().onDragEnd,
        result,
        announce,
        messagePreset.onDragEnd,
      ),
    );
  };

  // A non user initiated cancel
  const abort = () => {
    // aborting can happen defensively
    if (!dragging) {
      return;
    }

    const result: DropResult = {
      ...getDragStart(dragging.lastCritical, dragging.mode),
      combine: null,
      destination: null,
      reason: 'CANCEL',
    };
    drop(result);
  };

  return {
    beforeStart,
    start,
    update,
    flush,
    drop,
    abort,
  };
};
