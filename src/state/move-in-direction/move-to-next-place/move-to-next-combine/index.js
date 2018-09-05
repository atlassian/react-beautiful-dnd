// @flow
import invariant from 'tiny-invariant';
import type { Position } from 'css-box-model';
import type {
  DraggableDimension,
  DroppableDimension,
  DragImpact,
  CombineImpact,
  UserDirection,
  DraggableLocation,
} from '../../../../types';
import type { Result } from '../move-to-next-place-types';
import withDroppableDisplacement from '../../../with-droppable-displacement';
import { add } from '../../../position';

const forward: UserDirection = {
  vertical: 'down',
  horizontal: 'right',
};

const backward: UserDirection = {
  vertical: 'up',
  horizontal: 'left',
};

export type Args = {|
  isMovingForward: boolean,
  isInHomeList: boolean,
  draggable: DraggableDimension,
  destination: DroppableDimension,
  insideDestination: DraggableDimension[],
  previousImpact: DragImpact,
|};

export default ({
  isMovingForward,
  isInHomeList,
  draggable,
  destination,
  insideDestination,
  previousImpact,
}: Args): ?Result => {
  if (!destination.isCombineEnabled) {
    return null;
  }

  // we move from a merge to a reorder
  if (previousImpact.merge) {
    return null;
  }

  const location: ?DraggableLocation = previousImpact.destination;
  invariant(location, 'previous location required for combining');

  const currentIndex: number = location.index;

  // When finding the target we need to consider displacement
  // We need to move onto things in their current displacement
  // TODO: don't use IIFE

  const current: DraggableDimension[] = (() => {
    const shallow = insideDestination.slice();

    if (isInHomeList) {
      shallow.splice(draggable.descriptor.index, 1);
    }
    shallow.splice(location.index, 0, draggable);
    return shallow;
  })();

  const targetIndex: number = isMovingForward
    ? currentIndex + 1
    : currentIndex - 1;

  if (targetIndex < 0) {
    return null;
  }

  // The last item that can be grouped with is the last one
  if (targetIndex > current.length - 1) {
    return null;
  }

  const target: DraggableDimension = current[targetIndex];
  console.log('target id', target.descriptor.id);
  const isTargetDisplaced: boolean = Boolean(
    previousImpact.movement.map[target.descriptor.id],
  );
  const targetCenter: Position = target.page.borderBox.center;
  const withDisplacement: Position = isTargetDisplaced
    ? add(targetCenter, previousImpact.movement.displacedBy.point)
    : targetCenter;
  const pageBorderBoxCenter: Position = withDroppableDisplacement(
    destination,
    withDisplacement,
  );

  const merge: CombineImpact = {
    whenEntered: isMovingForward ? forward : backward,
    combine: {
      draggableId: target.descriptor.id,
      droppableId: destination.descriptor.id,
    },
  };

  const newImpact: DragImpact = {
    // grouping does not modify the existing displacement
    movement: previousImpact.movement,
    // grouping removes the destination
    destination: null,
    direction: destination.axis.direction,
    merge,
  };

  const result: Result = {
    pageBorderBoxCenter,
    impact: newImpact,
    scrollJumpRequest: null,
  };

  return result;
};
