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
  DisplacementMap,
} from '../../types';
import whatIsDraggedOver from '../droppable/what-is-dragged-over';
import getDisplacement from '../get-displacement';
import getDisplacementMap from '../get-displacement-map';
import isUserMovingForward from '../user-direction/is-user-moving-forward';
import getDisplacedBy from '../get-displaced-by';

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

  const displacedBy: DisplacedBy = getDisplacedBy(
    destination.axis,
    draggable.displaceBy,
    false,
  );

  const targetCenter: number = currentCenter[axis.line];
  const displacement: number = displacedBy.value;

  const isEnteringList: boolean =
    whatIsDraggedOver(previousImpact) !== destination.descriptor.id;

  const displaced: Displacement[] = insideDestination
    .filter(
      (child: DraggableDimension): boolean => {
        const borderBox: Rect = child.page.borderBox;
        const start: number = borderBox[axis.start];
        const end: number = borderBox[axis.end];

        const isDisplaced: boolean = Boolean(map[child.descriptor.id]);
        // If entering list then assume everything is displaced for initial impact
        const isDisplacedBy: number =
          isDisplaced || isEnteringList ? displacement : 0;

        // When in foreign list, can only displace forwards
        // Moving forward will decrease the amount of things needed to be displaced
        if (isMovingForward) {
          return targetCenter < start + isDisplacedBy;
        }

        // Moving backwards
        // Moving backwards will increase the amount of things needed to be displaced

        if (isDisplaced) {
          return true;
        }

        // No longer need to displace
        return targetCenter < end;
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
    displacedBy,
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
    merge: null,
  };

  return impact;
};
