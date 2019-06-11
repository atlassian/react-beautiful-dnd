// @flow
import { type Position, type Rect } from 'css-box-model';
import type {
  DraggableDimension,
  DroppableDimension,
  DragImpact,
  Axis,
  DisplacementGroups,
  ReorderImpact,
  Viewport,
  UserDirection,
  DisplacedBy,
} from '../../types';
import isUserMovingForward from '../user-direction/is-user-moving-forward';
import getDisplacedBy from '../get-displaced-by';
import removeDraggableFromList from '../remove-draggable-from-list';
import isHomeOf from '../droppable/is-home-of';
import { find } from '../../native-with-fallback';
import getDisplacementGroups from '../get-displacement-groups';
import { emptyGroups } from '../no-impact';

type Args = {|
  pageBorderBoxCenterWithDroppableScrollChange: Position,
  draggable: DraggableDimension,
  destination: DroppableDimension,
  insideDestination: DraggableDimension[],
  last: DisplacementGroups,
  viewport: Viewport,
  userDirection: UserDirection,
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

  const insideDestinationWithoutDraggable = removeDraggableFromList(
    draggable,
    insideDestination,
  );

  const targetCenter: number = currentCenter[axis.line];
  const displacement: number = displacedBy.value;

  const first: ?DraggableDimension = find(
    insideDestinationWithoutDraggable,
    (child: DraggableDimension) => {
      const borderBox: Rect = child.page.borderBox;
      const start: number = borderBox[axis.start];
      const end: number = borderBox[axis.end];

      if (isMovingForward) {
        return targetCenter < start + displacement;
      }

      // moving backwards
      return targetCenter <= end;
    },
  );

  if (!first) {
    return {
      displaced: emptyGroups,
      displacedBy,
      // go into last spot of list
      at: at(destination, rawIndexOfLastItem),
    };
  }

  const impacted: DraggableDimension[] = insideDestinationWithoutDraggable.slice(
    first.descriptor.index,
  );

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
    at: at(destination, first.descriptor.index),
  };

  return impact;
};
