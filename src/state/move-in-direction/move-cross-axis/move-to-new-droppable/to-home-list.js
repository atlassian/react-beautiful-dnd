// @flow
import invariant from 'tiny-invariant';
import { type Position } from 'css-box-model';
import moveToEdge from '../../../move-to-edge';
import getDisplacement from '../../../get-displacement';
import withDroppableDisplacement from '../../../with-droppable-displacement';
import { patch } from '../../../position';
import getDisplacementMap from '../../../get-displacement-map';
import type { Edge } from '../../../move-to-edge';
import type { Result } from '../move-cross-axis-types';
import type {
  Axis,
  Viewport,
  Displacement,
  DragImpact,
  DraggableDimension,
  DroppableDimension,
} from '../../../../types';

type Args = {|
  amount: Position,
  homeIndex: number,
  movingRelativeTo: DraggableDimension,
  insideDestination: DraggableDimension[],
  draggable: DraggableDimension,
  destination: DroppableDimension,
  previousImpact: DragImpact,
  viewport: Viewport,
|};

export default ({
  amount,
  homeIndex,
  movingRelativeTo,
  insideDestination,
  draggable,
  destination,
  previousImpact,
  viewport,
}: Args): Result => {
  const axis: Axis = destination.axis;
  const targetIndex: number = insideDestination.indexOf(movingRelativeTo);

  invariant(
    targetIndex !== -1,
    'Unable to find target in destination droppable',
  );

  // Moving back to original index
  // Super simple - just move it back to the original center with no impact
  if (targetIndex === homeIndex) {
    const newCenter: Position = draggable.page.borderBox.center;

    return {
      pageBorderBoxCenter: withDroppableDisplacement(destination, newCenter),
      // TODO: use getHomeImpact (this is just copied)
      impact: {
        movement: {
          displaced: [],
          map: {},
          isBeyondStartPosition: false,
          amount: patch(axis.line, draggable.client.marginBox[axis.size]),
        },
        direction: axis.direction,
        destination: {
          index: draggable.descriptor.index,
          droppableId: draggable.descriptor.droppableId,
        },
        group: null,
      },
    };
  }

  // When moving *before* where the item started:
  // We align the dragging item top of the target
  // and move everything from the target to the original position forwards

  // When moving *after* where the item started:
  // We align the dragging item to the end of the target
  // and move everything from the target to the original position backwards

  const isMovingPastOriginalIndex = targetIndex > homeIndex;
  const edge: Edge = isMovingPastOriginalIndex ? 'end' : 'start';

  const newCenter: Position = moveToEdge({
    source: draggable.page.borderBox,
    sourceEdge: edge,
    destination: isMovingPastOriginalIndex
      ? movingRelativeTo.page.borderBox
      : movingRelativeTo.page.marginBox,
    destinationEdge: edge,
    destinationAxis: axis,
  });

  const modified: DraggableDimension[] = (() => {
    if (!isMovingPastOriginalIndex) {
      return insideDestination.slice(targetIndex, homeIndex);
    }

    // We are aligning to the bottom of the target and moving everything
    // back to the original index backwards

    // We want everything after the original index to move
    const from: number = homeIndex + 1;
    // We need the target to move backwards
    const to: number = targetIndex + 1;

    // Need to ensure that the list is sorted with the closest item being first
    return insideDestination.slice(from, to).reverse();
  })();

  const displaced: Displacement[] = modified.map(
    (dimension: DraggableDimension): Displacement =>
      getDisplacement({
        draggable: dimension,
        destination,
        previousImpact,
        viewport: viewport.frame,
      }),
  );

  const newImpact: DragImpact = {
    movement: {
      displaced,
      map: getDisplacementMap(displaced),
      amount,
      isBeyondStartPosition: isMovingPastOriginalIndex,
    },
    direction: axis.direction,
    destination: {
      droppableId: destination.descriptor.id,
      index: targetIndex,
    },
    group: null,
  };

  return {
    pageBorderBoxCenter: withDroppableDisplacement(destination, newCenter),
    impact: newImpact,
  };
};
