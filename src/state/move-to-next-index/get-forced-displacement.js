// @flow
import getDisplacement from '../get-displacement';
import type {
  Area,
  Axis,
  DraggableId,
  DragImpact,
  DraggableDimensionMap,
  DroppableDimension,
  DraggableDimension,
  Displacement,
} from '../../types';

type WithAdded = {|
  add: DraggableId,
  previousImpact: DragImpact,
  droppable: DroppableDimension,
  draggables: DraggableDimensionMap,
  viewport: Area,
|}

export const withFirstAdded = ({
  add,
  previousImpact,
  droppable,
  draggables,
  viewport,
}: WithAdded): Displacement[] => {
  const newDisplacement: Displacement = {
    draggableId: add,
    isVisible: true,
    shouldAnimate: true,
  };

  const added: Displacement[] = [
    newDisplacement,
    ...previousImpact.movement.displaced,
  ];

  const withUpdatedVisibility: Displacement[] =
    added.map((current: Displacement): Displacement => {
      // we have already calculated the displacement for this item
      if (current === newDisplacement) {
        return current;
      }

      const updated: Displacement = getDisplacement({
        draggable: draggables[current.draggableId],
        destination: droppable,
        previousImpact,
        viewport,
      });

      return updated;
    });

  return withUpdatedVisibility;
};

type WithLastRemoved = {|
  dragging: DraggableId,
  isVisibleInNewLocation: boolean,
  previousImpact: DragImpact,
  droppable: DroppableDimension,
  draggables: DraggableDimensionMap,
|}

const forceVisibleDisplacement = (current: Displacement): Displacement => {
  // if already visible - can use the existing displacement
  if (current.isVisible) {
    return current;
  }

  // if not visible - immediately force visibility
  return {
    draggableId: current.draggableId,
    isVisible: true,
    shouldAnimate: false,
  };
};

export const withFirstRemoved = ({
  dragging,
  isVisibleInNewLocation,
  previousImpact,
  droppable,
  draggables,
}: WithLastRemoved): Displacement[] => {
  const last: Displacement[] = previousImpact.movement.displaced;
  if (!last.length) {
    console.error('cannot remove displacement from empty list');
    return [];
  }

  const withFirstRestored: Displacement[] = last.slice(1, last.length);

  // list is now empty
  if (!withFirstRestored.length) {
    return withFirstRestored;
  }

  // Simple case: no forced movement required
  // no displacement visibility will be updated by this move
  // so we can simply return the previous values
  if (isVisibleInNewLocation) {
    return withFirstRestored;
  }

  const axis: Axis = droppable.axis;

  // When we are forcing this displacement, we need to adjust the visibility of draggables
  // within a particular range. This range is the size of the dragging item and the item
  // that is being restored to its original
  const sizeOfRestored: number = draggables[last[0].draggableId].page.withMargin[axis.size];
  const sizeOfDragging: number = draggables[dragging].page.withMargin[axis.size];
  let buffer: number = sizeOfRestored + sizeOfDragging;

  const withUpdatedVisibility: Displacement[] =
    withFirstRestored.map((displacement: Displacement, index: number): Displacement => {
      // we are ripping this one away and forcing it to move
      if (index === 0) {
        return forceVisibleDisplacement(displacement);
      }

      if (buffer > 0) {
        const current: DraggableDimension = draggables[displacement.draggableId];
        const size: number = current.page.withMargin[axis.size];
        buffer -= size;

        return forceVisibleDisplacement(displacement);
      }

      // We know that these items cannot be visible after the move
      return {
        draggableId: displacement.draggableId,
        isVisible: false,
        shouldAnimate: false,
      };
    });

  return withUpdatedVisibility;
};

