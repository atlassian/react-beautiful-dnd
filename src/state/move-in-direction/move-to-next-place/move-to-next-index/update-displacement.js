// @flow
import invariant from 'tiny-invariant';
import type { DraggableDimension, Displacement } from '../../../../types';

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
