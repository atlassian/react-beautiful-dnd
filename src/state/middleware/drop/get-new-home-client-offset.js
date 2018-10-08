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
import withDroppableDisplacement from '../../with-droppable-displacement';
import whatIsDraggedOver from '../../droppable/what-is-dragged-over';
import { add, subtract } from '../../position';
import getPageBorderBoxCenterFromImpact from '../../get-page-border-box-center-from-impact';

type Args = {|
  impact: DragImpact,
  draggable: DraggableDimension,
  dimensions: DimensionMap,
  viewport: Viewport,
|};

const getScrollDisplacement = (
  droppable: DroppableDimension,
  viewport: Viewport,
): Position =>
  withDroppableDisplacement(droppable, viewport.scroll.diff.displacement);

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

  const newHomeClientOffset: Position = add(
    offset,
    // If cancelling: consider the home droppable
    // If dropping over nothing: consider the home droppable
    // If dropping over a droppable: consider the scroll of the droppable you are over
    getScrollDisplacement(droppable || home, viewport),
  );

  return newHomeClientOffset;
};
