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
} from '../../types';
import getDisplacement from '../get-displacement';
import getDisplacementMap from '../get-displacement-map';
import isUserMovingForward from '../user-direction/is-user-moving-forward';
import getDisplacedBy from '../get-displaced-by';

type Args = {|
  pageBorderBoxCenterWithDroppableScrollChange: Position,
  draggable: DraggableDimension,
  destination: DroppableDimension,
  insideDestination: DraggableDimension[],
  previousImpact: DragImpact,
  viewport: Viewport,
  userDirection: UserDirection,
|};

export default ({
  pageBorderBoxCenterWithDroppableScrollChange: currentCenter,
  draggable,
  destination,
  insideDestination,
  previousImpact,
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
  const targetCenter: number = currentCenter[axis.line];
  const displacement: number = displacedBy.value;

  const displaced: Displacement[] = insideDestination
    .filter(
      (child: DraggableDimension): boolean => {
        // TODO: what to do for home lists here?
        const borderBox: Rect = child.page.borderBox;
        const start: number = borderBox[axis.start];
        const end: number = borderBox[axis.end];

        // If entering list then assume everything is displaced for initial impact
        // reminder: 'displacement' can be positive or negative

        // When in foreign list, can only displace forwards
        // Moving forward will decrease the amount of things needed to be displaced
        if (isMovingForward) {
          return targetCenter <= start + displacement;
        }

        // Moving backwards towards top of list
        // Moving backwards will increase the amount of things needed to be displaced

        // this will be hit when:
        // - move backwards in the first position
        // - enter into a foreign list moving backwards

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
