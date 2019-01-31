// @flow
import type { Position } from 'css-box-model';
import type {
  DroppableDimension,
  Viewport,
  DragImpact,
  DraggableDimension,
  DraggableDimensionMap,
  DisplacementMap,
} from '../../../types';
import getPageBorderBoxCenterFromImpact from '../get-page-border-box-center';
import getClientFromPageBorderBoxCenter from './get-client-from-page-border-box-center';

type Args = {|
  impact: DragImpact,
  draggable: DraggableDimension,
  droppable: DroppableDimension,
  draggables: DraggableDimensionMap,
  viewport: Viewport,
  displacedToBeInOriginalSpot: DisplacementMap,
|};

export default ({
  impact,
  draggable,
  droppable,
  draggables,
  viewport,
  displacedToBeInOriginalSpot,
}: Args): Position => {
  const pageBorderBoxCenter: Position = getPageBorderBoxCenterFromImpact({
    impact,
    draggable,
    draggables,
    droppable,
    displacedToBeInOriginalSpot,
  });

  return getClientFromPageBorderBoxCenter({
    pageBorderBoxCenter,
    draggable,
    viewport,
  });
};
