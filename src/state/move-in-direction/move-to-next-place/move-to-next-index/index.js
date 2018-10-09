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
import { withUpdatedVisibility } from './get-forced-displacement';
import withDroppableDisplacement from '../../../with-droppable-displacement';

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
  // The last impact would not have its visibility updated.
  // In order to prevent a large amount of renders when moving between lists
  // we need to be sure to keep the amount of displaced things small.
  const previousImpact: DragImpact = withUpdatedVisibility({
    previousImpact: needsVisibilityCheck,
    viewport,
    destination,
    draggables,
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
    // not applying the displacement of the droppable for this check
    // we are only interested in the page location of the dragging item
    withDroppableDisplacement: false,
    // we only care about it being visible relative to the main axis
    // this is important with dynamic changes as scroll bar and toggle
    // on the cross axis during a drag
    onlyOnMainAxis: true,
  });

  if (!isVisibleInNewLocation) {
    console.warn('IS NOT VISIBLE');
  }

  console.log(
    'displacement',
    impact.movement.displaced.map(d => d.draggableId),
  );

  if (isVisibleInNewLocation) {
    return {
      pageBorderBoxCenter: newPageBorderBoxCenter,
      impact,
      scrollJumpRequest: null,
    };
  }

  // The full distance required to get from the previous page center to the new page center
  const distance: Position = subtract(
    newPageBorderBoxCenter,
    previousPageBorderBoxCenter,
  );

  // console.log('previous page border box center');
  // console.log('distance', distance);

  return {
    pageBorderBoxCenter: previousPageBorderBoxCenter,
    impact,
    scrollJumpRequest: distance,
  };
};
