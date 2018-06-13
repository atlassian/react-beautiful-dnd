// @flow
import invariant from 'tiny-invariant';
import {
  offset,
  withScroll,
  type BoxModel,
  type Position,
} from 'css-box-model';
import type {
  Axis,
  DimensionMap,
  Publish,
  DraggableId,
  DroppableId,
  DraggableDimension,
  DroppableDimension,
  DraggableDimensionMap,
} from '../../types';
import { patch } from '../position';
import * as timings from '../../debug/timings';

type Args = {|
  existing: DimensionMap,
  publish: Publish,
  windowScroll: Position,
|}

type Result = {|
  dimensions: DimensionMap,
  initial: DragPositions,
  current: DragPositions,
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
  existing,
  publish,
  windowScroll,
}: Args): DimensionMap => {
  timings.start(timingKey);
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
    const home: ?DroppableDimension = existing.droppables[droppableId];
    invariant(home, `Cannot find home Droppable for added Draggable ${draggable.descriptor.id}`);

    withEntry(set, droppableId).additions.push(getRecord(draggable, home));
  });

  // Draggable removals
  publish.removals.draggables.forEach((id: DraggableId) => {
    // Pull draggable dimension from existing dimensions
    const draggable: ?DraggableDimension = existing.draggables[id];
    invariant(draggable, `Cannot find Draggable ${id}`);
    const droppableId: DroppableId = draggable.descriptor.droppableId;
    const home: ?DroppableDimension = existing.droppables[droppableId];
    invariant(home, `Cannot find home Droppable for added Draggable ${id}`);

    withEntry(set, droppableId).removals.push(getRecord(draggable, home));
  });

  // ## Adjust draggables based on changes

  const shifted: DraggableDimensionMap = Object.keys(existing.draggables)
    .map((id: DraggableId): DraggableDimension => {
      const draggable: DraggableDimension = existing.draggables[id];
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

      const droppable: DroppableDimension = existing.droppables[droppableId];
      const additionSize: number = getTotal(additions);
      const removalSize: number = getTotal(removals);
      const deltaShift: number = additionSize - removalSize;
      console.log('DELTA SHIFT', deltaShift);

      const change: Position = patch(droppable.axis.line, deltaShift);
      const client: BoxModel = offset(draggable.client, change);
      // TODO: should this be different?
      const page: BoxModel = withScroll(client, windowScroll);

      const indexChange: number = additions.length - removals.length;
      console.log('INDEX SHIFT', indexChange);
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

  const dimensions: DimensionMap = {
    draggables: {
      ...shifted,
      ...publish.additions.draggables,
    },
    droppables: {
      ...existing.droppables,
      ...publish.additions.droppables,
    },
  };

  // We also need to remove the Draggables and Droppables from this new map

  publish.removals.draggables.forEach((id: DraggableId) => {
    delete dimensions.draggables[id];
  });

  publish.removals.droppables.forEach((id: DroppableId) => {
    delete dimensions.droppables[id];
  });

  timings.finish(timingKey);

  return dimensions;
};
