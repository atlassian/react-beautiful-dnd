// @flow
import invariant from 'tiny-invariant';
import messagePreset from '../util/screen-reader-message-preset';
import * as timings from '../../../debug/timings';
import getExpiringAnnounce from './expiring-announce';
import getAsyncMarshal, { type AsyncMarshal } from './async-marshal';
import type {
  DropResult,
  Responders,
  ResponderProvided,
  Critical,
  DragImpact,
  DraggableLocation,
  Combine,
  DragStart,
  Announce,
  DragUpdate,
  MovementMode,
  OnBeforeDragStartResponder,
  OnDragStartResponder,
  OnDragUpdateResponder,
  OnDragEndResponder,
  DroppableId,
} from '../../../types';
import { isCombineEqual, isCriticalEqual, areLocationsEqual } from './is-equal';
import whatIsDraggedOverFromResult from '../../droppable/what-is-dragged-over-from-result';
import whatIsDraggedOver from '../../droppable/what-is-dragged-over';
import { noMovement } from '../../no-impact';

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

type AnyPrimaryResponderFn =
  | OnDragStartResponder
  | OnDragUpdateResponder
  | OnDragEndResponder;
type AnyResponderData = DragStart | DragUpdate | DropResult;

const execute = (
  responder: ?AnyPrimaryResponderFn,
  data: AnyResponderData,
  announce: Announce,
  getDefaultMessage: (data: any) => string,
) => {
  if (!responder) {
    announce(getDefaultMessage(data));
    return;
  }

  const willExpire: Announce = getExpiringAnnounce(announce);
  const provided: ResponderProvided = {
    announce: willExpire,
  };

  // Casting because we are not validating which data type is going into which responder
  responder((data: any), provided);

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

export default (
  getDragDropContextResponders: () => Responders,
  getDroppableResponders: (id: DroppableId) => Responders,
  announce: Announce,
) => {
  const asyncMarshal: AsyncMarshal = getAsyncMarshal();
  let dragging: ?WhileDragging = null;

  const beforeStart = (critical: Critical, mode: MovementMode) => {
    invariant(
      !dragging,
      'Cannot fire onBeforeDragStart as a drag start has already been published',
    );
    withTimings('onBeforeDragStart', () => {
      // No use of screen reader for this responder
      const act = (responder: ?OnBeforeDragStartResponder) => {
        if (responder) {
          responder(getDragStart(critical, mode));
        }
      };

      // Drag drop context responders before droppable
      act(getDragDropContextResponders().onBeforeDragStart);
      act(getDroppableResponders(critical.droppable.id).onBeforeDragStart);
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

    // we will flush this frame if we receive any responder updates
    asyncMarshal.add(() => {
      withTimings('onDragStart', () => {
        const act = (responder: ?OnDragStartResponder) => {
          if (responder) {
            execute(responder, data, announce, messagePreset.onDragStart);
          }
        };

        act(getDragDropContextResponders().onDragStart);
        act(getDroppableResponders(critical.droppable.id).onDragStart);
      });
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
    const previous: WhileDragging = { ...dragging };

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
      withTimings('onDragUpdate', () => {
        const act = (responder: ?OnDragUpdateResponder) => {
          if (responder) {
            execute(responder, data, announce, messagePreset.onDragUpdate);
          }
        };

        act(getDragDropContextResponders().onDragUpdate);

        // update home droppable
        const homeId: DroppableId = critical.droppable.id;
        act(getDroppableResponders(homeId).onDragUpdate);

        // update a foreign droppable if over
        const isOver: ?DroppableId = whatIsDraggedOver(impact);

        // currently over a foreign
        if (isOver && isOver !== homeId) {
          act(getDroppableResponders(isOver).onDragUpdate);
        }

        // update a foreign droppable if no longer over
        const wasOver: ?DroppableId = (() => {
          if (previous.lastLocation) {
            return previous.lastLocation.droppableId;
          }
          if (previous.lastCombine) {
            return previous.lastCombine.droppableId;
          }
          return null;
        })();

        // update a droppable if we were over a foreign list that we
        // are no longer over
        if (wasOver && wasOver !== homeId && wasOver !== isOver) {
          act(getDroppableResponders(wasOver).onDragUpdate);
        }
      });
    });
  };

  const flush = () => {
    invariant(dragging, 'Can only flush responders while dragging');
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
    withTimings('onDragEnd', () => {
      const act = (responder: ?OnDragEndResponder) => {
        if (responder) {
          execute(responder, result, announce, messagePreset.onDragEnd);
        }
      };
      act(getDragDropContextResponders().onDragEnd);
      // fire critical droppable responders
      const homeId: DroppableId = result.source.droppableId;
      act(getDroppableResponders(homeId).onDragEnd);

      const overId: ?DroppableId = whatIsDraggedOverFromResult(result);

      // if over nothing, or over home, there is nothing to do
      if (!overId || overId === homeId) {
        return;
      }

      // over foreign list: call the onDragEnd
      act(getDroppableResponders(overId).onDragEnd);
    });
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
