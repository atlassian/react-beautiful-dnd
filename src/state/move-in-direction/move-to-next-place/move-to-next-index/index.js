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
  CombineImpact,
  DroppableDimension,
  DraggableDimensionMap,
  DragImpact,
  Viewport,
  DisplacedBy,
  DraggableLocation,
} from '../../../../types';

const getCurrentLocation = (
  isInHomeList: boolean,
  draggable: DraggableDimension,
  isMovingForward: boolean,
  previousImpact: DragImpact,
  draggables: DraggableDimensionMap,
): DraggableLocation => {
  // need to create what the location would have been before the combine
  const merge: ?CombineImpact = previousImpact.merge;

  // was not previously merging - use the last destination
  if (!merge) {
    const location: ?DraggableLocation = previousImpact.destination;
    invariant(location, 'Cannot keyboard move without a previous destination');
    return location;
  }

  // was previously merging - need to fake the 'last location'
  const isCombinedWith: DraggableDimension =
    draggables[merge.combine.draggableId];
  const isDisplaced: boolean = Boolean(
    previousImpact.movement.map[isCombinedWith.descriptor.id],
  );
  // const isInFrontOfStart: boolean = isInHomeList
  //   ? isCombinedWith.descriptor.index > draggable.descriptor.index
  //   : false;
  // const isMovingIntoCombinedSpot: boolean = isDisplaced &&

  // const combinedIndex: number = isCombinedWith.descriptor.index;
  // // where we expect the index to be AFTER the movement
  // const finalIndex: number = (() => {
  //   // moving forward will increase the amount of things displaced
  //   if (isInFrontOfStart) {
  //     if (isDisplaced) {
  //       return isMovingForward
  //         ? combinedIndex
  //         : combinedIndex - 1;
  //     }
  //     return isMovingForward ? combinedIndex
  //   }

  //   if (isDisplaced) {
  //     return isMovingForward
  //       ? isCombinedWith.descriptor.index
  //       : isCombinedWith.descriptor.index;
  //   }

  //   return isMovingForward
  //     ? isCombinedWith.descriptor.index - 1
  //     : isCombinedWith.descriptor.index + 1;
  // })();

  // const index: number = isMovingForward ? finalIndex - 1 : finalIndex + 1;

  const fudged: DraggableLocation = {
    droppableId: isCombinedWith.descriptor.droppableId,
    index: 0,
  };
  // console.log('was combined with', wasCombined.descriptor.id);
  // console.log('fudged', fudged);
  return fudged;
};

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
  const location: DraggableLocation = getCurrentLocation(
    isInHomeList,
    isMovingForward,
    previousImpact,
    draggables,
  );

  const inList: ?InListResult = isInHomeList
    ? inHomeList({
        isMovingForward,
        draggable,
        destination,
        location,
        insideDestination,
      })
    : inForeignList({
        isMovingForward,
        draggable,
        destination,
        location,
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
