// @flow
import memoizeOne from 'memoize-one';
import { type Position, type Spacing } from 'css-box-model';
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

const removeDraggable = memoizeOne(
  (
    remove: DraggableDimension,
    list: DraggableDimension[],
  ): DraggableDimension[] =>
    list.filter(
      (item: DraggableDimension) => item.descriptor.id !== remove.descriptor.id,
    ),
);

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
  const withoutDraggable = removeDraggable(draggable, insideDestination);

  const displaced: Displacement[] = withoutDraggable
    .filter(
      (child: DraggableDimension): boolean => {
        // did this item start displaced when the drag started?
        const didStartDisplaced: boolean = Boolean(
          onLift.wasDisplaced[child.descriptor.id],
        );

        const borderBox: Spacing = didStartDisplaced
          ? // shift an item that started displaced to be as if it where not displaced
            offsetByPosition(
              child.page.borderBox,
              negate(onLift.displacedBy.point),
            )
          : child.page.borderBox;
        const start: number = borderBox[axis.start];
        const end: number = borderBox[axis.end];

        // Moving forward will decrease the amount of things needed to be displaced
        if (isMovingForward) {
          return targetCenter <= start + displacement;
        }

        // Moving backwards towards top of list
        // Moving backwards will increase the amount of things needed to be displaced
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
          onLift,
        }),
    );

  const newIndex: number = withoutDraggable.length - displaced.length;

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
