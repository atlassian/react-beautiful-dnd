// @flow
import type { DraggableDimension, DraggableLocation } from '../../../../types';

type Args = {|
  isMovingForward: boolean,
  isInHomeList: boolean,
  location: DraggableLocation,
  insideDestination: DraggableDimension[],
|};

export default ({
  isMovingForward,
  isInHomeList,
  insideDestination,
  location,
}: Args): ?number => {
  if (!insideDestination.length) {
    return null;
  }

  const currentIndex: number = location.index;
  const proposedIndex: number = isMovingForward
    ? currentIndex + 1
    : currentIndex - 1;

  // Accounting for lists that might not start with an index of 0
  const firstIndex: number = insideDestination[0].descriptor.index;
  const lastIndex: number =
    insideDestination[insideDestination.length - 1].descriptor.index;

  // When in foreign list we allow movement after the last item
  const upperBound: number = isInHomeList ? lastIndex : lastIndex + 1;

  if (proposedIndex < firstIndex) {
    return null;
  }
  if (proposedIndex > upperBound) {
    return null;
  }

  return proposedIndex;
};
