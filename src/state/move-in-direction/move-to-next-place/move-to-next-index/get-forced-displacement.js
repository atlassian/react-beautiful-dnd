// @flow
import invariant from 'tiny-invariant';
import type {
  Viewport,
  DragImpact,
  DraggableDimensionMap,
  DroppableDimension,
  DraggableDimension,
  Displacement,
} from '../../../../types';
import getDisplacement from '../../../get-displacement';
import getDisplacementMap from '../../../get-displacement-map';

type WithUpdatedVisibilityArgs = {|
  previousImpact: DragImpact,
  viewport: Viewport,
  destination: DroppableDimension,
  draggables: DraggableDimensionMap,
|};

export const withUpdatedVisibility = ({
  previousImpact,
  viewport,
  destination,
  draggables,
}: WithUpdatedVisibilityArgs): DragImpact => {
  const displaced: Displacement[] = previousImpact.movement.displaced.map(
    (current: Displacement): Displacement =>
      getDisplacement({
        draggable: draggables[current.draggableId],
        destination,
        previousImpact,
        viewport: viewport.frame,
      }),
  );

  const updated: DragImpact = {
    ...previousImpact,
    movement: {
      ...previousImpact.movement,
      displaced,
      map: getDisplacementMap(displaced),
    },
  };
  return updated;
};

export const addClosest = (
  add: DraggableDimension,
  displaced: Displacement[],
): Displacement[] => {
  const added: Displacement = {
    draggableId: add.descriptor.id,
    isVisible: true,
    shouldAnimate: true,
  };
  return [added, ...displaced];
};

export const removeClosest = (displaced: Displacement[]): Displacement[] => {
  invariant(
    displaced.length,
    'Cannot remove closest when there is nothing to remove',
  );

  return displaced.slice(1);
};
