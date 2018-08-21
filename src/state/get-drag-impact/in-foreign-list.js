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
  DisplacementMap,
} from '../../types';
import { patch } from '../position';
import getDisplacement from '../get-displacement';
import getDisplacementMap from '../get-displacement-map';
import isUserMovingForward from '../user-direction/is-user-moving-forward';

type Args = {|
  pageBorderBoxCenterWithDroppableScroll: Position,
  draggable: DraggableDimension,
  destination: DroppableDimension,
  insideDestination: DraggableDimension[],
  previousImpact: DragImpact,
  viewport: Viewport,
  direction: UserDirection,
|};

export default ({
  pageBorderBoxCenterWithDroppableScroll: currentCenter,
  draggable,
  destination,
  insideDestination,
  previousImpact,
  viewport,
  direction,
}: Args): DragImpact => {
  const axis: Axis = destination.axis;
  const map: DisplacementMap = previousImpact.movement.map;

  const isMovingForward: boolean = isUserMovingForward(
    destination.axis,
    direction,
  );

  const amount: Position = patch(
    axis.line,
    draggable.page.marginBox[axis.size],
  );
  // always displaced forward
  const displacement: number = amount[axis.line];

  const displaced: Displacement[] = insideDestination
    .filter(
      (child: DraggableDimension): boolean => {
        const isDisplaced: boolean = Boolean(map[child.descriptor.id]);
        const displacedBy: number = isDisplaced ? displacement : 0;

        const borderBox: Rect = child.page.borderBox;
        const start: number = borderBox[axis.start];
        const end: number = borderBox[axis.end];

        // When in foreign list, can only displace forwards
        // Moving forward will decrease the amount of things needed to be displaced
        if (isMovingForward) {
          return currentCenter[axis.line] < start + displacedBy;
        }

        // Moving backwards
        // Moving backwards will increase the amount of things needed to be displaced

        if (isDisplaced) {
          return true;
        }

        // No longer need to displace
        return currentCenter[axis.line] < end;
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
    isInFrontOfStart: false,
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
