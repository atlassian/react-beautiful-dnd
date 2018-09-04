// @flow
import invariant from 'tiny-invariant';
import type { Position } from 'css-box-model';
import inHomeList from './in-home-list';
import inForeignList from './in-foreign-list';
import isTotallyVisibleInNewLocation from './is-totally-visible-in-new-location';
import { withFirstAdded, withFirstRemoved } from './get-forced-displacement';
import getDisplacedBy from '../../../get-displaced-by';
import getDisplacementMap from '../../../get-displacement-map';
import withDroppableDisplacement from '../../../with-droppable-displacement';
import type { Result } from '../move-to-next-place-types';
import { subtract } from '../../../position';
import type { InListResult } from './move-to-next-index-types';
import type {
  Axis,
  DraggableDimension,
  Displacement,
  DroppableDimension,
  DraggableDimensionMap,
  DragImpact,
  Viewport,
  DisplacedBy,
  DraggableLocation,
} from '../../../../types';

export type Args = {|
  isMovingForward: boolean,
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
  draggable,
  destination,
  draggables,
  insideDestination,
  previousImpact,
  previousPageBorderBoxCenter,
  viewport,
}: Args): ?Result => {
  const isInHomeList: boolean =
    draggable.descriptor.droppableId === destination.descriptor.id;

  const oldLocation: ?DraggableLocation = previousImpact.destination;
  invariant(oldLocation);

  const inList: ?InListResult = isInHomeList
    ? inHomeList({
        isMovingForward,
        draggable,
        destination,
        location: oldLocation,
        insideDestination,
      })
    : inForeignList({
        isMovingForward,
        draggable,
        destination,
        location: oldLocation,
        insideDestination,
      });

  if (!inList) {
    return null;
  }

  const addToDisplacement: ?DraggableDimension = inList.addToDisplacement;
  const newPageBorderBoxCenter: Position = inList.newPageBorderBoxCenter;
  const isInFrontOfStart: boolean = inList.isInFrontOfStart;
  const proposedIndex: number = inList.proposedIndex;
  const axis: Axis = destination.axis;

  const isVisibleInNewLocation: boolean = isTotallyVisibleInNewLocation({
    draggable,
    destination,
    newPageBorderBoxCenter,
    viewport: viewport.frame,
    // we only care about it being visible relative to the main axis
    // this is important with dynamic changes as scroll bar and toggle
    // on the cross axis during a drag
    onlyOnMainAxis: true,
  });

  const displaced: Displacement[] = addToDisplacement
    ? withFirstAdded({
        add: addToDisplacement,
        destination,
        draggables,
        previousImpact,
        viewport,
      })
    : withFirstRemoved({
        dragging: draggable,
        destination,
        isVisibleInNewLocation,
        previousImpact,
        draggables,
      });

  const displacedBy: DisplacedBy = getDisplacedBy(
    axis,
    draggable.displaceBy,
    isInFrontOfStart,
  );

  const newImpact: DragImpact = {
    movement: {
      displacedBy,
      displaced,
      map: getDisplacementMap(displaced),
      isInFrontOfStart,
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
      pageBorderBoxCenter: withDroppableDisplacement(
        destination,
        newPageBorderBoxCenter,
      ),
      impact: newImpact,
      scrollJumpRequest: null,
    };
  }

  // The full distance required to get from the previous page center to the new page center
  const distance: Position = subtract(
    newPageBorderBoxCenter,
    previousPageBorderBoxCenter,
  );
  const distanceWithScroll: Position = withDroppableDisplacement(
    destination,
    distance,
  );

  return {
    pageBorderBoxCenter: previousPageBorderBoxCenter,
    impact: newImpact,
    scrollJumpRequest: distanceWithScroll,
  };
};
