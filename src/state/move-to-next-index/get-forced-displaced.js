// @flow
import getDisplacement from '../get-displacement';
import type {
  Area,
  Axis,
  Position,
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
  distanceMoving: Position,
  previousImpact: DragImpact,
  droppable: DroppableDimension,
  draggables: DraggableDimensionMap,
  viewport: Area,
|}

export const withFirstRemoved = ({
  distanceMoving,
  previousImpact,
  droppable,
  draggables,
  viewport,
}: WithLastRemoved): Displacement[] => {
  const last: Displacement[] = previousImpact.movement.displaced;
  if (!last.length) {
    console.error('cannot remove displacement from empty list');
    return [];
  }

  const removed: Displacement[] = last.slice(1, last.length);

  const axis: Axis = droppable.axis;
  let buffer: number = Math.abs(distanceMoving[axis.line]);

  console.group('forced');
  console.log('starting buffer', buffer);

  const withUpdatedVisibility: Displacement[] =
    removed.map((displacement: Displacement): Displacement => {
      // we need to ensure that the previous items up to the size of the
      // dragging item has a visible movement. This is because a movement
      // can result in a combination of scrolls that have this effect.
      // Technically we could just do this when the destination is not visible - but
      // there is no harm doing it all the time for simplicity

      // It seems to provide a more accurate experience to force displacement when buffer >= 0
      // rather than just > 0.
      console.log('buffer', buffer);
      if (buffer >= 0) {
        const current: DraggableDimension = draggables[displacement.draggableId];

        // Using the 'withoutMargin' size. When moving often we do not consider the margin
        // as a part of the calculations for determining the new center position. As such,
        // we do not reduce the buffer by the size of the margin.
        const size: number = current.page.withoutMargin[axis.size];
        buffer -= size;

        // displacement was already visible - can leave it unmodified
        if (displacement.isVisible) {
          console.log('returning original for', displacement.draggableId);
          return displacement;
        }

        // the displacement was not visible - we need to force it to be visible and in
        // place immediately.
        console.log('forcing for', displacement.draggableId);
        return {
          draggableId: displacement.draggableId,
          isVisible: true,
          shouldAnimate: false,
        };
      }

      console.log('recalculating for', displacement.draggableId, getDisplacement({
        draggable: draggables[displacement.draggableId],
        destination: droppable,
        previousImpact,
        viewport,
      }));

      // We are outside of the buffer - we can now execute standard visibility checks
      const updated: Displacement = getDisplacement({
        draggable: draggables[displacement.draggableId],
        destination: droppable,
        previousImpact,
        viewport,
      });

      return updated;
    });

  console.groupEnd();

  return withUpdatedVisibility;
};

