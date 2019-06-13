// @flow
import { type Position, type Rect } from 'css-box-model';
import type {
  DraggableId,
  DraggableDimension,
  DroppableDimension,
  DragImpact,
  Axis,
  DisplacementGroups,
  Viewport,
  UserDirection,
  DisplacedBy,
  LiftEffect,
} from '../../types';
import isUserMovingForward from '../user-direction/is-user-moving-forward';
import getDisplacedBy from '../get-displaced-by';
import removeDraggableFromList from '../remove-draggable-from-list';
import isHomeOf from '../droppable/is-home-of';
import { find } from '../../native-with-fallback';
import getDidStartDisplaced from '../starting-displaced/did-start-displaced';
import calculateReorderImpact from './calculate-reorder-impact';
// import getDisplaced from '../get-displaced';

type Args = {|
  pageBorderBoxCenterWithDroppableScrollChange: Position,
  draggable: DraggableDimension,
  destination: DroppableDimension,
  insideDestination: DraggableDimension[],
  last: DisplacementGroups,
  viewport: Viewport,
  userDirection: UserDirection,
  afterCritical: LiftEffect,
|};

type AtIndexArgs = {|
  draggable: DraggableDimension,
  closest: ?DraggableDimension,
  inHomeList: boolean,
|};

function atIndex({ draggable, closest, inHomeList }: AtIndexArgs): ?number {
  if (!closest) {
    return null;
  }

  if (!inHomeList) {
    return closest.descriptor.index;
  }

  if (closest.descriptor.index > draggable.descriptor.index) {
    return closest.descriptor.index - 1;
  }

  return closest.descriptor.index;
}

export default ({
  pageBorderBoxCenterWithDroppableScrollChange: currentCenter,
  draggable,
  destination,
  insideDestination,
  last,
  viewport,
  userDirection,
  afterCritical,
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
  const withoutDragging: DraggableDimension[] = removeDraggableFromList(
    draggable,
    insideDestination,
  );

  const closest: ?DraggableDimension = find(
    withoutDragging,
    (child: DraggableDimension): boolean => {
      const id: DraggableId = child.descriptor.id;
      const borderBox: Rect = child.page.borderBox;
      const start: number = borderBox[axis.start];
      const end: number = borderBox[axis.end];

      const didStartDisplaced: boolean = getDidStartDisplaced(
        id,
        afterCritical,
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
    },
  );

  const newIndex: ?number = atIndex({
    draggable,
    closest,
    inHomeList: isHomeOf(draggable, destination),
  });

  return calculateReorderImpact({
    draggable,
    insideDestination,
    destination,
    viewport,
    last,
    displacedBy,
    index: newIndex,
  });
};
