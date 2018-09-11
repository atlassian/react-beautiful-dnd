// @flow
import type { Position } from 'css-box-model';
import isTotallyVisibleInNewLocation from './is-totally-visible-in-new-location';
import { withFirstAdded, withFirstRemoved } from './get-forced-displacement';
import getDisplacedBy from '../../../get-displaced-by';
import getDisplacementMap from '../../../get-displacement-map';
import { subtract } from '../../../position';
import fromReorder from './from-reorder';
import fromCombine from './from-combine';
import type { Result } from '../move-to-next-place-types';
import type {
  MoveFromResult,
  ChangeDisplacement,
} from './move-to-next-index-types';
import type {
  Axis,
  DraggableDimension,
  Displacement,
  DroppableDimension,
  DraggableDimensionMap,
  DragImpact,
  Viewport,
  DisplacedBy,
} from '../../../../types';

export type Args = {|
  isMovingForward: boolean,
  isInHomeList: boolean,
  draggable: DraggableDimension,
  destination: DroppableDimension,
  draggables: DraggableDimensionMap,
  insideDestination: DraggableDimension[],
  previousImpact: DragImpact,
  previousPageBorderBoxCenter: Position,
  viewport: Viewport,
|};

export default ({
  isMovingForward,
  isInHomeList,
  draggable,
  destination,
  draggables,
  insideDestination,
  previousImpact,
  previousPageBorderBoxCenter,
  viewport,
}: Args): ?Result => {
  const move: ?MoveFromResult =
    fromReorder({
      isMovingForward,
      isInHomeList,
      draggable,
      destination,
      draggables,
      previousImpact,
      insideDestination,
      previousPageBorderBoxCenter,
    }) ||
    fromCombine({
      isMovingForward,
      isInHomeList,
      draggable,
      destination,
      draggables,
      previousImpact,
    });

  if (!move) {
    return null;
  }

  console.log('proposed index', move.proposedIndex);

  const newPageBorderBoxCenter: Position = move.newPageBorderBoxCenter;
  const willDisplaceForward: boolean = move.willDisplaceForward;
  const proposedIndex: number = move.proposedIndex;
  const axis: Axis = destination.axis;

  const isVisibleInNewLocation: boolean = isTotallyVisibleInNewLocation({
    draggable,
    destination,
    newPageBorderBoxCenter,
    viewport: viewport.frame,
    // not applying the displacement of the droppable for this check
    // we are only interested in the page location of the dragging item
    withDroppableDisplacement: false,
    // we only care about it being visible relative to the main axis
    // this is important with dynamic changes as scroll bar and toggle
    // on the cross axis during a drag
    onlyOnMainAxis: true,
  });

  const displaced: Displacement[] = (() => {
    const change: ChangeDisplacement = move.changeDisplacement;

    if (change.type === 'DO_NOTHING') {
      return previousImpact.movement.displaced;
    }

    if (change.type === 'ADD_CLOSEST') {
      return withFirstAdded({
        add: change.add,
        destination,
        draggables,
        previousImpact,
        viewport,
      });
    }

    return withFirstRemoved({
      dragging: draggable,
      destination,
      isVisibleInNewLocation,
      previousImpact,
      draggables,
    });
  })();

  const displacedBy: DisplacedBy = getDisplacedBy(
    axis,
    draggable.displaceBy,
    willDisplaceForward,
  );

  const newImpact: DragImpact = {
    movement: {
      displacedBy,
      displaced,
      map: getDisplacementMap(displaced),
      willDisplaceForward,
    },
    destination: {
      droppableId: destination.descriptor.id,
      index: proposedIndex,
    },
    direction: axis.direction,
    merge: null,
  };

  if (isVisibleInNewLocation) {
    return {
      pageBorderBoxCenter: newPageBorderBoxCenter,
      impact: newImpact,
      scrollJumpRequest: null,
    };
  }

  // The full distance required to get from the previous page center to the new page center
  const distance: Position = subtract(
    newPageBorderBoxCenter,
    previousPageBorderBoxCenter,
  );

  return {
    pageBorderBoxCenter: previousPageBorderBoxCenter,
    impact: newImpact,
    scrollJumpRequest: distance,
  };
};
