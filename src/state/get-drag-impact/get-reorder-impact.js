// @flow
import { type Position, type Spacing, type Rect } from 'css-box-model';
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
import { offsetByPosition } from '../spacing';
import { negate } from '../position';
import getDidStartDisplaced from '../starting-displaced/did-start-displaced';

type Args = {|
  pageBorderBoxCenterWithDroppableScrollChange: Position,
  draggable: DraggableDimension,
  destination: DroppableDimension,
  insideDestinationWithoutDraggable: DraggableDimension[],
  previousImpact: DragImpact,
  viewport: Viewport,
  userDirection: UserDirection,
  onLift: OnLift,
|};

type Edges = {|
  start: number,
  end: number,
|};

const getEdges = (
  draggable: DraggableDimension,
  displacement: number,
  axis: Axis,
  onLift: OnLift,
): Edges => {
  const borderBox: Rect = draggable.page.borderBox;
  const start: number = borderBox[axis.start];
  const end: number = borderBox[axis.end];
  const didStartDisplaced: boolean = getDidStartDisplaced(
    draggable.descriptor.id,
    onLift,
  );

  if (!didStartDisplaced) {
    return {
      start,
      end,
    };
  }

  // undo the displacement to be in the original position
  return {
    start: start - displacement,
    end: end - displacement,
  };
};

export default ({
  pageBorderBoxCenterWithDroppableScrollChange: currentCenter,
  draggable,
  destination,
  insideDestinationWithoutDraggable,
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

  const displaced: Displacement[] = insideDestinationWithoutDraggable
    .filter(
      (child: DraggableDimension): boolean => {
        const { start, end } = getEdges(child, displacement, axis, onLift);

        // Moving forward will decrease the amount of things needed to be displaced
        // Displace while center center is before the start
        if (isMovingForward) {
          // On start edge = displace
          return targetCenter <= start + displacement;
        }

        // Moving backwards will increase the amount of things needed to be displaced
        // Displace an item if the center goes before the end of an item
        // On end edge = displace
        return targetCenter <= end;
      },
    )
    .map(
      (dimension: DraggableDimension): Displacement =>
        getDisplacement({
          draggable: dimension,
          destination,
          previousImpact,
          viewport: viewport.frame,
          onLift,
        }),
    );

  const newIndex: number =
    insideDestinationWithoutDraggable.length - displaced.length;

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
