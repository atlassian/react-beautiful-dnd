// @flow
import invariant from 'tiny-invariant';
import {
  offset,
  withScroll,
  type BoxModel,
  type Position,
} from 'css-box-model';
import { patch } from '../position';
import * as timings from '../../debug/timings';
import type {
  Axis,
  DragImpact,
  DimensionMap,
  DraggingState,
  CollectingState,
  DropPendingState,
  DraggableDimension,
  DroppableDimension,
  Publish,
  DraggableId,
  DroppableId,
  DraggableDimensionMap,
} from '../../types';
import getDragImpact from '../get-drag-impact';
import getHomeImpact from '../get-home-impact';

type Args = {|
  state: CollectingState | DropPendingState,
  publish: Publish
|}

type Partitioned = {|
  inNewDroppable: DraggableDimension[],
  inExistingDroppable: DraggableDimension[],
|}

type Record = {|
  index: number,
  // the size of the dimension on the main axis
  size: number,
|}

// type RecordMap = {
//   [id: DraggableId]: Record
// }

type Entry = {|
  additions: Record[],
  removals: Record[],
|}

type ChangeSet = {
  [id: DroppableId]: Entry
}

const getTotal = (records: Record[]): number => records
  .reduce((total: number, record: Record) => total + record.size, 0);

const withEntry = (set: ChangeSet, droppableId: DroppableId): Entry => {
  if (!set[droppableId]) {
    set[droppableId] = {
      additions: [],
      removals: [],
    };
  }

  return set[droppableId];
};

const getRecord = (draggable: DraggableDimension, home: DroppableDimension) => {
  const axis: Axis = home.axis;
  const size: number = draggable.client.marginBox[axis.size];
  const record: Record = {
    index: draggable.descriptor.index,
    size,
  };
  return record;
};

const timingKey: string = 'Dynamic dimension change processing';

export default ({
  state,
  publish,
}: Args): DraggingState | DropPendingState => {
  timings.start(timingKey);
  // TODO: write validate that every removed draggable must have a removed droppable

  // ## Adding Draggables to existing lists
  // Added dimension is already in the correct location
  // If added to the end of the list then everything else is in the correct spot
  // If inserted within the list then everything else in the list has been pushed forward
  // by the size of the addition
  // If inserted before the critical draggable then everything initial and current DragPositions
  // need to be updated.

  // ## Removing Draggables from existing lists
  // Added dimension is already in the correct location
  // If removed from the end of the list - nothing to do
  // If removed from within a list then everything else is pulled forward
  // If removed before critical dimension then DragPositions need to be updated

  // ## Adding a new droppable
  // Addition already in right spot

  // ## Adding a Draggable to a new Droppable
  // Addition already in right spot

  const dimensions: DimensionMap = state.dimensions;
  // TODO: everything
  const partitioned: Partitioned = Object.keys(publish.additions.draggables)
    .map((id: DraggableId): DraggableDimension => publish.additions.draggables[id])
    .reduce((previous: Partitioned, draggable: DraggableDimension) => {
      const droppableId: DroppableId = draggable.descriptor.droppableId;
      const isInNewDroppable: boolean =
        Boolean(publish.additions.droppables[droppableId]);

      if (isInNewDroppable) {
        previous.inNewDroppable.push(draggable);
      } else {
        previous.inExistingDroppable.push(draggable);
      }
      return previous;
    }, {
      inNewDroppable: [],
      inExistingDroppable: [],
    });

  // TODO: can just exit early here
  if (!partitioned.inExistingDroppable.length) {
    console.log('no updates to existing droppables, can just move on');
  }

  const set: ChangeSet = {};

  // Draggable additions
  partitioned.inExistingDroppable.forEach((draggable: DraggableDimension) => {
    const droppableId: DroppableId = draggable.descriptor.droppableId;
    const home: ?DroppableDimension = dimensions.droppables[droppableId];
    invariant(home, `Cannot find home Droppable for added Draggable ${draggable.descriptor.id}`);

    withEntry(set, droppableId).additions.push(getRecord(draggable, home));
  });

  // Draggable removals
  publish.removals.draggables.forEach((id: DraggableId) => {
    // Pull draggable dimension from existing dimensions
    const draggable: ?DraggableDimension = dimensions.draggables[id];
    invariant(draggable, `Cannot find Draggable ${id}`);
    const droppableId: DroppableId = draggable.descriptor.droppableId;
    const home: ?DroppableDimension = dimensions.droppables[droppableId];
    invariant(home, `Cannot find home Droppable for added Draggable ${id}`);

    withEntry(set, droppableId).removals.push(getRecord(draggable, home));
  });

  // ## Adjust draggables based on changes

  const shifted: DraggableDimensionMap = Object.keys(dimensions.draggables)
    .map((id: DraggableId): DraggableDimension => {
      const draggable: DraggableDimension = dimensions.draggables[id];
      const droppableId: DroppableId = draggable.descriptor.droppableId;
      const entry: ?Entry = set[droppableId];

      // No additions or removals to the Droppable
      // Can just return the draggable
      if (!entry) {
        return draggable;
      }
      const startIndex: number = draggable.descriptor.index;

      // Were there any additions before the draggable?
      const additions: Record[] = entry.additions
        .filter((record: Record) => record.index <= startIndex);

      // Were there any removals before the droppable?
      const removals: Record[] = entry.removals
        .filter((record: Record) => record.index <= startIndex);

      // No changes before the draggable - no shifting required
      if (!additions.length && !removals.length) {
        return draggable;
      }

      const droppable: DroppableDimension = dimensions.droppables[droppableId];
      const additionSize: number = getTotal(additions);
      const removalSize: number = getTotal(removals);

      const change: Position = patch(droppable.axis.line, additionSize - removalSize);
      const client: BoxModel = offset(draggable.client, change);
      // TODO: should this be different?
      const page: BoxModel = withScroll(client, state.viewport.scroll.initial);

      const indexChange: number = additions.length - removals.length;
      const index: number = startIndex + indexChange;

      const moved: DraggableDimension = {
        ...draggable,
        descriptor: {
          ...draggable.descriptor,
          index,
        },
        placeholder: {
          ...draggable.placeholder,
          client,
        },
        client,
        page,
      };

      return moved;
    })
    .reduce((previous: DraggableDimensionMap, current: DraggableDimension) => {
      previous[current.descriptor.id] = current;
      return previous;
    }, {});

  // Let's add our shifted draggables to our dimension map

  const newDimensions: DimensionMap = {
    draggables: {
      ...shifted,
      ...publish.additions.draggables,
    },
    droppables: {
      ...state.dimensions.droppables,
      ...publish.additions.droppables,
    },
  };

  // We also need to remove the Draggables and Droppables from this new map

  publish.removals.draggables.forEach((id: DraggableId) => {
    delete newDimensions.draggables[id];
  });

  publish.removals.droppables.forEach((id: DroppableId) => {
    delete newDimensions.droppables[id];
  });

  timings.finish(timingKey);

  const impact: DragImpact = getDragImpact({
    pageBorderBoxCenter: state.current.page.borderBoxCenter,
    draggable: newDimensions.draggables[state.critical.draggable.id],
    draggables: newDimensions.draggables,
    droppables: newDimensions.droppables,
    previousImpact: getHomeImpact(state.critical, newDimensions),
    viewport: state.viewport,
  });

  const draggingState: DraggingState = {
    // appeasing flow
    phase: 'DRAGGING',
    ...state,
    // eslint-disable-next-line
      phase: 'DRAGGING',
    impact,
    dimensions: newDimensions,
  };

  if (state.phase === 'COLLECTING') {
    return draggingState;
  }

  // There was a DROP_PENDING
  // Staying in the DROP_PENDING phase
  // setting isWaiting for false

  const dropPending: DropPendingState = {
    // appeasing flow
    phase: 'DROP_PENDING',
    ...draggingState,
    // eslint-disable-next-line
    phase: 'DROP_PENDING',
    // No longer waiting
    reason: state.reason,
    isWaiting: false,
  };

  return dropPending;
};

