// @flow
import type { Position } from 'css-box-model';
import type {
  DroppableDimension,
  DraggableDimension,
  DraggableId,
  DraggableDimensionMap,
  DragImpact,
  Viewport,
} from '../../../types';
import type { InternalResult } from '../move-in-direction-types';
import getDraggablesInsideDroppable from '../../get-draggables-inside-droppable';
import moveToNextCombine from './move-to-next-combine';
import moveToNextIndex from './move-to-next-index';
import isHomeOf from '../../droppable/is-home-of';
import withDroppableDisplacement from '../../with-scroll-change/with-droppable-displacement';
import { speculativelyIncrease, recompute } from './update-visibility';
import { subtract } from '../../position';
import isTotallyVisibleInNewLocation from './is-totally-visible-in-new-location';
import getPageBorderBoxCenter from '../../get-center-from-impact/get-page-border-box-center';

type Args = {|
  isMovingForward: boolean,
  draggableId: DraggableId,
  destination: DroppableDimension,
  draggables: DraggableDimensionMap,
  viewport: Viewport,
  previousImpact: DragImpact,
  previousPageBorderBoxCenter: Position,
|};

export default ({
  isMovingForward,
  draggableId,
  destination,
  draggables,
  viewport,
  previousImpact: needsVisibilityCheck,
  previousPageBorderBoxCenter,
}: Args): ?InternalResult => {
  if (!destination.isEnabled) {
    return null;
  }

  const previousImpact: DragImpact = recompute({
    impact: needsVisibilityCheck,
    viewport,
    draggables,
    destination,
  });

  const draggable: DraggableDimension = draggables[draggableId];
  const insideDestination: DraggableDimension[] = getDraggablesInsideDroppable(
    destination,
    draggables,
  );
  const isInHomeList: boolean = isHomeOf(draggable, destination);

  const impact: ?DragImpact =
    moveToNextCombine({
      isInHomeList,
      isMovingForward,
      draggable,
      destination,
      insideDestination,
      previousImpact,
    }) ||
    moveToNextIndex({
      isMovingForward,
      isInHomeList,
      draggable,
      draggables,
      destination,
      insideDestination,
      previousImpact,
    });

  if (!impact) {
    return null;
  }

  const pageBorderBoxCenter: Position = getPageBorderBoxCenter({
    impact,
    draggable,
    droppable: destination,
    draggables,
  });

  const isVisibleInNewLocation: boolean = isTotallyVisibleInNewLocation({
    draggable,
    destination,
    newPageBorderBoxCenter: pageBorderBoxCenter,
    viewport: viewport.frame,
    withDroppableDisplacement: true,
    // we only care about it being visible relative to the main axis
    // this is important with dynamic changes as scroll bar and toggle
    // on the cross axis during a drag
    onlyOnMainAxis: true,
  });

  if (isVisibleInNewLocation) {
    return {
      type: 'MOVE',
      pageBorderBoxCenter,
      impact,
    };
  }

  console.log('👻 not visible in new location');

  // Need to account for any changes in the scroll in the destination
  const withDisplacement: Position = withDroppableDisplacement(
    destination,
    pageBorderBoxCenter,
  );

  const distance: Position = subtract(
    withDisplacement,
    previousPageBorderBoxCenter,
  );

  // need to guess the increased visible displacement
  // this is a worst case guess, which means that
  // it may visually displace things that do not need to
  const updated: DragImpact = speculativelyIncrease({
    impact,
    viewport,
    destination,
    draggables,
    maxScrollChange: distance,
  });

  return {
    type: 'SCROLL_JUMP',
    request: distance,
    impact: updated,
  };
};
