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
  GroupingImpact,
  UserDirection,
  DisplacementMap,
} from '../../types';
import { patch } from '../position';
import getDisplacement from '../get-displacement';
import withDroppableScroll from '../with-droppable-scroll';
import getDisplacementMap from '../get-displacement-map';
import getGroupingImpact from './get-grouping-impact';
import isUserMovingForward from '../is-user-moving-forward';

type Args = {|
  pageBorderBoxCenter: Position,
  draggable: DraggableDimension,
  destination: DroppableDimension,
  insideDestination: DraggableDimension[],
  previousImpact: DragImpact,
  viewport: Viewport,
  direction: UserDirection,
|};

export default ({
  pageBorderBoxCenter,
  draggable,
  destination,
  insideDestination,
  previousImpact,
  viewport,
  direction,
}: Args): DragImpact => {
  const axis: Axis = destination.axis;
  const map: DisplacementMap = previousImpact.movement.map;

  // We need to know what point to use to compare to the other
  // draggables in the list.
  // To do this we need to consider any displacement caused by
  // a change in scroll in the droppable we are currently over.

  const currentCenter: Position = withDroppableScroll(
    destination,
    pageBorderBoxCenter,
  );

  const isMovingForward: boolean = isUserMovingForward(
    direction,
    destination.axis,
  );

  const amount: Position = patch(
    axis.line,
    draggable.page.marginBox[axis.size],
  );
  // always displaced forward
  const displacedBy: number = amount[axis.line];

  // const group: ?GroupingImpact = getGroupingImpact({
  //   pageCenterWithDroppableScroll: currentCenter,
  //   draggable,
  //   destination,
  //   displaced: previousImpact.movement.map,
  //   insideDestination,
  //   direction,
  //   impact: previousImpact,
  // });

  const displaced: Displacement[] = insideDestination
    .filter(
      (child: DraggableDimension): boolean => {
        const isDisplaced: boolean = Boolean(map[child.descriptor.id]);

        const borderBox: Rect = child.page.borderBox;
        const start: number = borderBox[axis.start];
        const end: number = borderBox[axis.end];

        // When in foreign list, can only displace forwards
        // Moving forward will decrease the amount of things needed to be displaced
        if (isMovingForward) {
          if (isDisplaced) {
            return currentCenter[axis.line] < start + displacedBy;
          }

          return currentCenter[axis.line] < start;
        }

        // Moving backwards
        // Moving backwards will increase the amount of things needed to be displaced

        if (isDisplaced) {
          return true;
        }

        // No longer need to displace
        return currentCenter[axis.line] < end;

        // Items will be displaced forward if they sit ahead of the dragging item
        // const threshold: number = child.page.borderBox[axis.end];
        // return threshold > currentCenter[axis.line];

        // return false;
      },
    )
    .map(
      (dimension: DraggableDimension): Displacement =>
        getDisplacement({
          draggable: dimension,
          destination,
          previousImpact,
          viewport: viewport.frame,
        }),
    );

  const newIndex: number = insideDestination.length - displaced.length;

  const movement: DragMovement = {
    amount,
    displaced,
    map: getDisplacementMap(displaced),
    isBeyondStartPosition: false,
  };

  const impact: DragImpact = {
    movement,
    direction: axis.direction,
    destination: {
      droppableId: destination.descriptor.id,
      index: newIndex,
    },
    group: null,
  };

  return impact;
};
