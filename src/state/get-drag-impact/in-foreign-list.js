// @flow
import { type Position } from 'css-box-model';
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

  const group: ?GroupingImpact = getGroupingImpact({
    pageCenterWithDroppableScroll: currentCenter,
    draggable,
    destination,
    displaced: previousImpact.movement.map,
    insideDestination,
    direction,
    impact: previousImpact,
  });

  const displaced: Displacement[] = insideDestination
    .filter(
      (child: DraggableDimension): boolean => {
        // Maintain current displacement if grouping
        if (group) {
          if (child.descriptor.id === group.groupingWith.draggableId) {
            const isAlreadyDisplaced: boolean = Boolean(
              map[child.descriptor.id],
            );
            console.log('is already displaced', isAlreadyDisplaced, map);
            return isAlreadyDisplaced;
          }
        }
        // Items will be displaced forward if they sit ahead of the dragging item
        const threshold: number = child.page.borderBox[axis.end];
        return threshold > currentCenter[axis.line];
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
    amount: patch(axis.line, draggable.page.marginBox[axis.size]),
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
    group,
  };

  return impact;
};
