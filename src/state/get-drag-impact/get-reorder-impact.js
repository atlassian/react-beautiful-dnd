// @flow
import { type Position, type Rect } from 'css-box-model';
import type {
  DragMovement,
  DraggableDimension,
  DroppableDimension,
  DragImpact,
  Axis,
  Displacement,
  Viewport,
  UserDirection,
  DisplacedBy,
  OnLift,
} from '../../types';
import getDisplacement from '../get-displacement';
import getDisplacementMap from '../get-displacement-map';
import isUserMovingForward from '../user-direction/is-user-moving-forward';
import getDisplacedBy from '../get-displaced-by';
import getDidStartDisplaced from '../starting-displaced/did-start-displaced';
import removeDraggableFromList from '../remove-draggable-from-list';
import isHomeOf from '../droppable/is-home-of';

type Args = {|
  pageBorderBoxCenterWithDroppableScrollChange: Position,
  draggable: DraggableDimension,
  destination: DroppableDimension,
  insideDestination: DraggableDimension[],
  previousImpact: DragImpact,
  viewport: Viewport,
  userDirection: UserDirection,
  onLift: OnLift,
|};

export default ({
  pageBorderBoxCenterWithDroppableScrollChange: currentCenter,
  draggable,
  destination,
  insideDestination,
  previousImpact,
  viewport,
  userDirection,
  onLift,
}: Args): DragImpact => {
  const axis: Axis = destination.axis;
  const isMovingForward: boolean = isUserMovingForward(
    destination.axis,
    userDirection,
  );
  const displacedBy: DisplacedBy = getDisplacedBy(
    destination.axis,
    draggable.displaceBy,
  );
  const targetCenter: number = currentCenter[axis.line];
  const displacement: number = displacedBy.value;

  const insideDestinationWithoutDraggable = removeDraggableFromList(
    draggable,
    insideDestination,
  );

  const displaced: Displacement[] = insideDestinationWithoutDraggable
    .filter((child: DraggableDimension): boolean => {
      const borderBox: Rect = child.page.borderBox;
      const start: number = borderBox[axis.start];
      const end: number = borderBox[axis.end];

      const didStartDisplaced: boolean = getDidStartDisplaced(
        child.descriptor.id,
        onLift,
      );

      // Moving forward will decrease the amount of things needed to be displaced
      if (isMovingForward) {
        if (didStartDisplaced) {
          // if started displaced then its displaced position is its resting position
          // continue to keep the item at rest until we go onto the start of the item
          return targetCenter < start;
        }
        // if the item did not start displaced then we displace the item
        // while we are still before the start edge
        return targetCenter < start + displacement;
      }

      // Moving backwards will increase the amount of things needed to be displaced
      // The logic for this works by looking at assuming everything has been displaced
      // backwards and then looking at how you would undo that

      if (didStartDisplaced) {
        // we continue to displace the item until we move back over the end of the item without displacement
        return targetCenter <= end - displacement;
      }

      // a non-displaced item is at rest. when we hit the item from the bottom we move it out of the way
      return targetCenter <= end;
    })
    .map((dimension: DraggableDimension): Displacement =>
      getDisplacement({
        draggable: dimension,
        destination,
        previousImpact,
        viewport: viewport.frame,
        onLift,
      }),
    );

  // This is needed as we support lists with indexes that do not start from 0
  const rawIndexOfLastItem: number = (() => {
    if (!insideDestination.length) {
      return 0;
    }

    const indexOfLastItem: number =
      insideDestination[insideDestination.length - 1].descriptor.index;

    // When in a foreign list there will be an additional one item in the list
    return isHomeOf(draggable, destination)
      ? indexOfLastItem
      : indexOfLastItem + 1;
  })();

  const newIndex: number = rawIndexOfLastItem - displaced.length;

  const movement: DragMovement = {
    displacedBy,
    displaced,
    map: getDisplacementMap(displaced),
  };
  const impact: DragImpact = {
    movement,
    destination: {
      droppableId: destination.descriptor.id,
      index: newIndex,
    },
    merge: null,
  };

  return impact;
};
