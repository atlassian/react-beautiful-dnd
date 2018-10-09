// @flow
import type { Position } from 'css-box-model';
import type {
  DroppableDimension,
  Viewport,
  DragImpact,
  DimensionMap,
  DraggableDimension,
  DroppableId,
} from '../../../types';
import whatIsDraggedOver from '../../droppable/what-is-dragged-over';
import { subtract } from '../../position';
import getPageBorderBoxCenterFromImpact from '../../get-page-border-box-center-from-impact';
import getClientPoint from '../../get-client-point';

type Args = {|
  impact: DragImpact,
  draggable: DraggableDimension,
  dimensions: DimensionMap,
  viewport: Viewport,
|};

export default ({
  impact,
  draggable,
  dimensions,
  viewport,
}: Args): Position => {
  const { draggables, droppables } = dimensions;
  const droppableId: ?DroppableId = whatIsDraggedOver(impact);
  const droppable: ?DroppableDimension = droppableId
    ? droppables[droppableId]
    : null;
  const home: DroppableDimension = droppables[draggable.descriptor.droppableId];

  const newBorderBoxPageCenter: Position = getPageBorderBoxCenterFromImpact({
    impact,
    draggable,
    draggables,
    droppable,
  });

  // client offset will be the same as the page offset :D
  const offset: Position = subtract(
    newBorderBoxPageCenter,
    draggable.page.borderBox.center,
  );

  return getClientPoint(offset, droppable || home, viewport);
};
