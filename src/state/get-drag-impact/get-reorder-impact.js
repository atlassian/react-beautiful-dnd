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
import getDidStartAfterCritical from '../did-start-after-critical';
import calculateReorderImpact from '../calculate-drag-impact/calculate-reorder-impact';

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

  // Calculate the current start and end positions of the target item.
  const offset = displacement / 2;
  const targetStart = targetCenter - offset;
  const targetEnd = targetCenter + offset;

  const closest: ?DraggableDimension = find(
    withoutDragging,
    (child: DraggableDimension): boolean => {
      const id: DraggableId = child.descriptor.id;
      const borderBox: Rect = child.page.borderBox;
      const childCenter: number = borderBox.center[axis.line];

      // Adding a threshold amount before and after the center to create a buffer area
      // where combining can occur without triggering a reorder
      const centerThreshold: number = borderBox[axis.size] * 0.1;
      const childCenterStart: number = childCenter - centerThreshold;
      const childCenterEnd: number = childCenter + centerThreshold;

      const didStartAfterCritical: boolean = getDidStartAfterCritical(
        id,
        afterCritical,
      );

      // Moving forward will decrease the amount of things needed to be displaced
      if (isMovingForward) {
        if (didStartAfterCritical) {
          // if started displaced then its displaced position is its resting position
          // continue to keep the item at rest until we cross beyond the end point of the
          // center area of the item
          return targetEnd < childCenterEnd;
        }
        // if the item did not start displaced then we displace the item
        // while we have still not crossed into the center area of the item
        return targetEnd < childCenterEnd + displacement;
      }

      // Moving backwards will increase the amount of things needed to be displaced
      // The logic for this works by looking at assuming everything has been displaced
      // backwards and then looking at how you would undo that

      if (didStartAfterCritical) {
        // we continue to displace the item until we move back over the center of the item without displacement
        return targetStart <= childCenterStart - displacement;
      }

      // a non-displaced item is at rest. when we hit the item from the bottom we move it out of the way
      return targetStart <= childCenterStart;
    },
  );

  const newIndex: ?number = atIndex({
    draggable,
    closest,
    inHomeList: isHomeOf(draggable, destination),
  });

  // TODO: index cannot be null?
  // otherwise return null from there and return empty impact
  // that was calculate reorder impact does not need to account for a null index
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
