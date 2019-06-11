// @flow
import { type Position, type Rect } from 'css-box-model';
import type {
  DraggableId,
  DraggableDimension,
  DroppableDimension,
  DragImpact,
  Axis,
  DisplacementGroups,
  ReorderImpact,
  Viewport,
  UserDirection,
  DisplacedBy,
  OnLift,
} from '../../types';
import isUserMovingForward from '../user-direction/is-user-moving-forward';
import getDisplacedBy from '../get-displaced-by';
import removeDraggableFromList from '../remove-draggable-from-list';
import isHomeOf from '../droppable/is-home-of';
import { find, findIndex } from '../../native-with-fallback';
import getDisplacementGroups from '../get-displacement-groups';
import { emptyGroups } from '../no-impact';
import getDidStartDisplaced from '../starting-displaced/did-start-displaced';

type Args = {|
  pageBorderBoxCenterWithDroppableScrollChange: Position,
  draggable: DraggableDimension,
  destination: DroppableDimension,
  insideDestination: DraggableDimension[],
  last: DisplacementGroups,
  viewport: Viewport,
  userDirection: UserDirection,
  onLift: OnLift,
|};

function at(destination: DroppableDimension, index: number): ReorderImpact {
  return {
    type: 'REORDER',
    destination: {
      droppableId: destination.descriptor.id,
      index,
    },
  };
}

export default ({
  pageBorderBoxCenterWithDroppableScrollChange: currentCenter,
  draggable,
  destination,
  insideDestination,
  last,
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
  const withoutDragging: DraggableDimension[] = removeDraggableFromList(
    draggable,
    insideDestination,
  );

  const first: ?DraggableDimension = find(
    withoutDragging,
    (child: DraggableDimension): boolean => {
      const id: DraggableId = child.descriptor.id;
      const borderBox: Rect = child.page.borderBox;
      const start: number = borderBox[axis.start];
      const end: number = borderBox[axis.end];

      const didStartDisplaced: boolean = getDidStartDisplaced(id, onLift);

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

  // go into last spot of list
  if (!first) {
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

    return {
      displaced: emptyGroups,
      closestDisplaced: null,
      displacedBy,
      at: at(destination, rawIndexOfLastItem),
    };
  }

  const newIndex: number = withoutDragging.indexOf(first);
  const impacted: DraggableDimension[] = withoutDragging.slice(newIndex);

  const displaced: DisplacementGroups = getDisplacementGroups({
    afterDragging: impacted,
    destination,
    displacedBy,
    last,
    viewport: viewport.frame,
  });

  const impact: DragImpact = {
    displaced,
    displacedBy,
    closestDisplaced: first.descriptor.id,
    at: at(destination, newIndex),
  };

  return impact;
};
