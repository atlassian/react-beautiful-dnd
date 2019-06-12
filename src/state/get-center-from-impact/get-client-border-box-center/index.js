// @flow
import type { Position } from 'css-box-model';
import type {
  DroppableDimension,
  Viewport,
  DragImpact,
  DraggableDimension,
  DraggableDimensionMap,
  LiftEffect,
} from '../../../types';
import getPageBorderBoxCenterFromImpact from '../get-page-border-box-center';
import getClientFromPageBorderBoxCenter from './get-client-from-page-border-box-center';

type Args = {|
  impact: DragImpact,
  draggable: DraggableDimension,
  droppable: DroppableDimension,
  draggables: DraggableDimensionMap,
  viewport: Viewport,
  displacedByLift: LiftEffect,
|};

export default ({
  impact,
  draggable,
  droppable,
  draggables,
  viewport,
  displacedByLift,
}: Args): Position => {
  const pageBorderBoxCenter: Position = getPageBorderBoxCenterFromImpact({
    impact,
    draggable,
    draggables,
    droppable,
    displacedByLift,
  });

  return getClientFromPageBorderBoxCenter({
    pageBorderBoxCenter,
    draggable,
    viewport,
  });
};
