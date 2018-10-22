// @flow
import type { Position } from 'css-box-model';
import type {
  DroppableDimension,
  DraggableDimension,
  DraggableDimensionMap,
  DragImpact,
  Viewport,
} from '../../../types';
import type { PublicResult } from '../move-in-direction-types';
import getDraggablesInsideDroppable from '../../get-draggables-inside-droppable';
import moveToNextCombine from './move-to-next-combine';
import moveToNextIndex from './move-to-next-index';
import isHomeOf from '../../droppable/is-home-of';
import getPageBorderBoxCenter from '../../get-center-from-impact/get-page-border-box-center';
import speculativelyIncrease from '../../update-displacement-visibility/speculatively-increase';
import getClientFromPageBorderBoxCenter from '../../get-center-from-impact/get-client-border-box-center/get-client-from-page-border-box-center';
import { subtract } from '../../position';
import isTotallyVisibleInNewLocation from './is-totally-visible-in-new-location';

type Args = {|
  isMovingForward: boolean,
  draggable: DraggableDimension,
  destination: DroppableDimension,
  draggables: DraggableDimensionMap,
  previousImpact: DragImpact,
  viewport: Viewport,
  previousClientSelection: Position,
  previousPageBorderBoxCenter: Position,
|};

export default ({
  isMovingForward,
  draggable,
  destination,
  draggables,
  previousImpact,
  viewport,
  previousPageBorderBoxCenter,
  previousClientSelection,
}: Args): ?PublicResult => {
  if (!destination.isEnabled) {
    return null;
  }

  const insideDestination: DraggableDimension[] = getDraggablesInsideDroppable(
    destination.descriptor.id,
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
    // already taken into account by getPageBorderBoxCenter
    withDroppableDisplacement: false,
    // we only care about it being visible relative to the main axis
    // this is important with dynamic changes as scroll bar and toggle
    // on the cross axis during a drag
    onlyOnMainAxis: true,
  });

  if (isVisibleInNewLocation) {
    console.warn('👓 is visible in new position');
    // using the client center as the selection point
    const clientSelection: Position = getClientFromPageBorderBoxCenter({
      pageBorderBoxCenter,
      draggable,
      viewport,
    });
    return {
      clientSelection,
      impact,
      scrollJumpRequest: null,
    };
  }
  console.warn('👻 is not visible in new position');

  const distance: Position = subtract(
    pageBorderBoxCenter,
    previousPageBorderBoxCenter,
  );

  const cautious: DragImpact = speculativelyIncrease({
    impact,
    viewport,
    destination,
    draggables,
    maxScrollChange: distance,
  });

  return {
    clientSelection: previousClientSelection,
    impact: cautious,
    scrollJumpRequest: distance,
  };
};
