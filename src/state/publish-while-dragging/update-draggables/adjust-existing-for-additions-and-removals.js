// @flow
import { type Position } from 'css-box-model';
import type {
  Axis,
  DimensionMap,
  DraggableId,
  DroppableDimension,
  DraggableDimension,
  DraggableDimensionMap,
} from '../../types';
import {
  toDraggableMap,
  toDroppableList,
  toDraggableList,
} from '../../dimension-structures';
import { patch, add, negate } from '../../position';
import getDraggablesInsideDroppable from '../../get-draggables-inside-droppable';
import offsetDraggable from './offset-draggable';

type Args = {|
  existing: DimensionMap,
  additions: DraggableDimension[],
  removals: DraggableId[],
  initialWindowScroll: Position,
|};

type Shift = {|
  indexChange: number,
  offset: Position,
|};

type ShiftMap = {
  [id: DraggableId]: Shift,
};

export default ({
  existing,
  additions: addedDraggables,
  removals: removedDraggables,
  initialWindowScroll,
}: Args): DraggableDimension[] => {
  const droppables: DroppableDimension[] = toDroppableList(existing.droppables);

  const shifted: DraggableDimensionMap = {};

  droppables.forEach((droppable: DroppableDimension) => {
    const axis: Axis = droppable.axis;

    const original: DraggableDimension[] = getDraggablesInsideDroppable(
      droppable.descriptor.id,
      existing.draggables,
    );

    const toShift: ShiftMap = {};

    const addShift = (id: DraggableId, shift: Shift) => {
      const previous: ?Shift = toShift[id];

      if (!previous) {
        toShift[id] = shift;
        return;
      }

      toShift[id] = {
        indexChange: previous.indexChange + shift.indexChange,
        offset: add(previous.offset, shift.offset),
      };
    };

    // phase 1: removals
    const removals: DraggableDimensionMap = toDraggableMap(
      removedDraggables
        .map((id: DraggableId): DraggableDimension => existing.draggables[id])
        // only care about the ones inside of this droppable
        .filter(
          (draggable: DraggableDimension): boolean =>
            draggable.descriptor.droppableId === droppable.descriptor.id,
        ),
    );

    const withRemovals: DraggableDimension[] = original.filter(
      (item: DraggableDimension, index: number): boolean => {
        const isBeingRemoved: boolean = Boolean(removals[item.descriptor.id]);

        // Item is not being removed - no need to shift anything
        if (!isBeingRemoved) {
          return true;
        }

        // moving backwards by size
        const offset: Position = negate(
          patch(axis.line, item.client.marginBox[axis.size]),
        );

        original.slice(index).forEach((sibling: DraggableDimension) => {
          // no point shifting this as it is about to be removed
          if (removals[sibling.descriptor.id]) {
            return;
          }

          addShift(sibling.descriptor.id, {
            // item is being moved backwards one index
            indexChange: -1,
            offset,
          });
        });

        // We can now remove the draggable as its shift has been recorded
        return false;
      },
    );

    // Phase 2: additions
    // We do this on the withRemovals array as the new index coming in already account for removals

    const additions: DraggableDimension[] = addedDraggables.filter(
      (draggable: DraggableDimension): boolean =>
        draggable.descriptor.droppableId === droppable.descriptor.id,
    );

    // Insert additions into the correct positions
    // We can do this because the additions are correctly ordered
    const withAdditions: DraggableDimension[] = withRemovals.slice(0);
    additions.forEach((item: DraggableDimension) => {
      withAdditions.splice(item.descriptor.index, 0, item);
    });
    const additionMap: DraggableDimensionMap = toDraggableMap(additions);

    // Calculate the offset to be applied to shifted items
    withAdditions.forEach((item: DraggableDimension, index: number) => {
      const wasAdded: boolean = Boolean(additionMap[item.descriptor.id]);
      // no shifting required when added
      if (!wasAdded) {
        return;
      }
      // need to shift everything after the addition

      // moving forward by size
      const offset: Position = patch(
        axis.line,
        item.client.marginBox[axis.size],
      );

      withAdditions.slice(index).forEach((sibling: DraggableDimension) => {
        // no shifting required for newly added items
        // - they are already captured in the right spot
        if (additionMap[sibling.descriptor.id]) {
          return;
        }

        addShift(sibling.descriptor.id, {
          // item is being moved forwards one index
          indexChange: 1,
          offset,
        });
      });
    });

    // Phase 3: shift dimensions
    withAdditions.forEach((item: DraggableDimension) => {
      if (additionMap[item.descriptor.id]) {
        return;
      }

      const shift: Shift = toShift[item.descriptor.id];
      if (!shift) {
        return;
      }

      const moved: DraggableDimension = offsetDraggable({
        draggable: item,
        offset: shift.offset,
        initialWindowScroll,
      });

      const index: number = item.descriptor.index + shift.indexChange;
      const updated: DraggableDimension = {
        ...moved,
        descriptor: {
          ...item.descriptor,
          index,
        },
      };

      // Add to big cache
      shifted[moved.descriptor.id] = updated;
    });
  });

  const map: DraggableDimensionMap = {
    ...existing.draggables,
    // will overwrite existing draggables with shifted values if required
    ...shifted,
  };

  return toDraggableList(map);
};
