// @flow
import type { Position } from 'css-box-model';
import type {
  UserDirection,
  DraggableDimension,
  DroppableDimension,
  GroupingImpact,
  DragImpact,
} from '../../types';

type Args = {|
  pageBorderBoxCenterWithDroppableScroll: Position,
  previousImpact: DragImpact,
  draggable: DraggableDimension,
  destination: DroppableDimension,
  insideDestination: DraggableDimension[],
  direction: UserDirection,
|};
export default ({
  pageBorderBoxCenterWithDroppableScroll,
  previousImpact,
  draggable,
  destination,
  insideDestination,
  direction,
}: Args): ?GroupingImpact => {
  if (!destination.isGroupingEnabled) {
    return null;
  }

  return null;

  const movement: DragMovement = previousImpact.movement;
  const map: DisplacementMap = movement.map;
  const modifier: number = movement.isBeyondStartPosition ? -1 : 1;
  const displacement: number = amount[axis.line] * modifier;
  const amount: Position = patch(
    axis.line,
    draggable.client.marginBox[axis.size],
  );

  const target: ?DraggableDimension = insideDestination.find(
    (child: DraggableDimension): boolean => {
      // Cannot group with yourself
      if (child.descriptor.id === draggable.descriptor.id) {
        return false;
      }

      const isDisplaced: boolean = Boolean(map[child.descriptor.id]);
      const displacedBy: number = isDisplaced ? displacement : 0;
    },
  );
};
