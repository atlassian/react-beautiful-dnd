// @flow
import type { DraggableDimension, DraggableLocation } from '../../../../types';
import type { Instruction } from './move-to-next-index-types';

type Args = {|
  isMovingForward: boolean,
  isInHomeList: boolean,
  location: DraggableLocation,
  draggable: DraggableDimension,
  insideDestination: DraggableDimension[],
|};

export default ({
  isMovingForward,
  isInHomeList,
  draggable,
  insideDestination: initialInside,
  location,
}: Args): ?Instruction => {
  const insideDestination: DraggableDimension[] = initialInside.slice();
  const currentIndex: number = location.index;
  const isInForeignList: boolean = !isInHomeList;

  // in foreign list we need to insert the item into the right spot
  if (isInForeignList) {
    insideDestination.splice(location.index, 0, draggable);
  }
  const proposedIndex: number = isMovingForward
    ? currentIndex + 1
    : currentIndex - 1;

  if (proposedIndex < 0) {
    return null;
  }
  if (proposedIndex > insideDestination.length - 1) {
    return null;
  }

  return {
    proposedIndex,
    modifyDisplacement: true,
  };
};
