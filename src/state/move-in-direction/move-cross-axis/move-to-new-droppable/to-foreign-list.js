// @flow
import invariant from 'tiny-invariant';
import { type Position } from 'css-box-model';
import moveToEdge from '../../../move-to-edge';
import type { Result } from '../move-cross-axis-types';
import getDisplacement from '../../../get-displacement';
import withDroppableDisplacement from '../../../with-droppable-displacement';
import getDisplacementMap from '../../../get-displacement-map';
import getDisplacedBy from '../../../get-displaced-by';
import { noMovement } from '../../../no-impact';
import type {
  Axis,
  DragImpact,
  DraggableDimension,
  DroppableDimension,
  Displacement,
  Viewport,
  DisplacedBy,
} from '../../../../types';

type Args = {|
  pageBorderBoxCenter: Position,
  movingRelativeTo: ?DraggableDimension,
  insideDestination: DraggableDimension[],
  draggable: DraggableDimension,
  destination: DroppableDimension,
  previousImpact: DragImpact,
  viewport: Viewport,
|};

export default ({
  pageBorderBoxCenter,
  movingRelativeTo,
  insideDestination,
  draggable,
  destination,
  previousImpact,
  viewport,
}: Args): Result => {
  const axis: Axis = destination.axis;
  const isGoingBeforeTarget: boolean = Boolean(
    movingRelativeTo &&
      pageBorderBoxCenter[destination.axis.line] <
        movingRelativeTo.page.borderBox.center[destination.axis.line],
  );

  // Moving to an empty list

  if (!movingRelativeTo) {
    // Move to start edge of the destination
    // based on the axis of the destination

    const newCenter: Position = moveToEdge({
      source: draggable.page.borderBox,
      sourceEdge: 'start',
      destination: destination.page.contentBox,
      destinationEdge: 'start',
      destinationAxis: axis,
    });

    const newImpact: DragImpact = {
      movement: noMovement,
      direction: axis.direction,
      destination: {
        droppableId: destination.descriptor.id,
        index: 0,
      },
      group: null,
    };

    return {
      pageBorderBoxCenter: withDroppableDisplacement(destination, newCenter),
      impact: newImpact,
    };
  }

  // Moving to a populated list

  const targetIndex: number = insideDestination.indexOf(movingRelativeTo);
  invariant(
    targetIndex !== -1,
    'The target was not found within its droppable',
  );

  const proposedIndex: number = isGoingBeforeTarget
    ? targetIndex
    : targetIndex + 1;

  const newCenter: Position = moveToEdge({
    // Aligning to visible top of draggable
    source: draggable.page.borderBox,
    sourceEdge: 'start',
    destination: movingRelativeTo.page.marginBox,
    destinationEdge: isGoingBeforeTarget ? 'start' : 'end',
    destinationAxis: axis,
  });

  // Can only displace forward when moving into a foreign list
  // if going before: move everything down including the target
  // if going after: move everything down excluding the target

  const displaced: Displacement[] = insideDestination
    .slice(proposedIndex, insideDestination.length)
    .map(
      (dimension: DraggableDimension): Displacement =>
        getDisplacement({
          draggable: dimension,
          destination,
          viewport: viewport.frame,
          previousImpact,
        }),
    );

  const displacedBy: DisplacedBy = getDisplacedBy(
    destination.axis,
    draggable.displaceBy,
    false,
  );

  const newImpact: DragImpact = {
    movement: {
      displacedBy,
      displaced,
      map: getDisplacementMap(displaced),
      isInFrontOfStart: false,
    },
    direction: axis.direction,
    destination: {
      droppableId: destination.descriptor.id,
      index: proposedIndex,
    },
    group: null,
  };

  return {
    pageBorderBoxCenter: withDroppableDisplacement(destination, newCenter),
    impact: newImpact,
  };
};
