// @flow
import invariant from 'tiny-invariant';
import type {
  Axis,
  DisplacedBy,
  DraggableDimension,
  Displacement,
  DroppableDimension,
  DragImpact,
  DraggableLocation,
} from '../../../../../types';

type Args = {|
  isMovingForward: boolean,
  isInHomeList: boolean,
  draggable: DraggableDimension,
  insideDestination: DraggableDimension[],
  previousImpact: DragImpact,
|};

export default ({
  isMovingForward,
  isInHomeList,
  previousImpact,
  draggable,
  insideDestination: initialInside,
}: Args): ?number => {
  if (previousImpact.merge) {
    return null;
  }
  const location: ?DraggableLocation = previousImpact.destination;
  invariant(location, 'Cannot move to next index without previous destination');

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

  return proposedIndex;
};
