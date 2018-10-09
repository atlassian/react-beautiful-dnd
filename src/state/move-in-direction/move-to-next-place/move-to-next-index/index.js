// @flow
import type { Position } from 'css-box-model';
import type { InternalResult } from '../../move-in-direction-types';
import type {
  DraggableDimension,
  DroppableDimension,
  DraggableDimensionMap,
  DragImpact,
  Viewport,
} from '../../../../types';
import fromReorder from './from-reorder';
import getPageBorderBoxCenterFromImpact from '../../../get-page-border-box-center-from-impact';
import isTotallyVisibleInNewLocation from '../is-totally-visible-in-new-location';
import { subtract } from '../../../position';
import { speculativelyIncrease, recompute } from './update-visibility';
import withDroppableDisplacement from '../../../with-scroll-change/with-droppable-displacement';

export type Args = {|
  isMovingForward: boolean,
  isInHomeList: boolean,
  draggable: DraggableDimension,
  draggables: DraggableDimensionMap,
  destination: DroppableDimension,
  insideDestination: DraggableDimension[],
  previousImpact: DragImpact,
  previousPageBorderBoxCenter: Position,
  viewport: Viewport,
|};

let callCount = 0;

export default ({
  isMovingForward,
  isInHomeList,
  draggable,
  destination,
  draggables,
  insideDestination,
  previousImpact: needsVisibilityCheck,
  previousPageBorderBoxCenter,
  viewport,
}: Args): ?InternalResult => {
  console.warn(`🏃‍♂️ MOVE TO NEXT INDEX: ${++callCount}`);
  const previousImpact: DragImpact = recompute({
    impact: needsVisibilityCheck,
    viewport,
    draggables,
    destination,
  });

  const impact: ?DragImpact = fromReorder({
    isMovingForward,
    isInHomeList,
    draggable,
    destination,
    previousImpact,
    insideDestination,
  });

  // no impact can be achieved
  if (!impact) {
    return null;
  }

  const newPageBorderBoxCenter: Position = getPageBorderBoxCenterFromImpact({
    impact,
    draggable,
    droppable: destination,
    draggables,
  });

  const isVisibleInNewLocation: boolean = isTotallyVisibleInNewLocation({
    draggable,
    destination,
    newPageBorderBoxCenter,
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
      pageBorderBoxCenter: newPageBorderBoxCenter,
      impact,
    };
  }

  console.log('👻 not visible in new location');

  // The full distance required to get from the previous page center to the new page center
  const withDisplacement: Position = withDroppableDisplacement(
    destination,
    newPageBorderBoxCenter,
  );

  const distance: Position = subtract(
    withDisplacement,
    previousPageBorderBoxCenter,
  );

  console.log('distance needed', distance);

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
