// @flow
import type { Position } from 'css-box-model';
import type {
  DroppableDimension,
  Viewport,
  DragImpact,
  DimensionMap,
  DraggableDimension,
  DroppableId,
  DropReason,
} from '../../../../types';
import withDroppableDisplacement from '../../../with-droppable-displacement';
import whatIsDraggedOver from '../../../droppable/what-is-dragged-over';
import { add, subtract } from '../../../position';
import getBorderBoxCenter from './get-border-box-center';

type Args = {|
  reason: DropReason,
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
  reason,
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

  const newBorderBoxClientCenter: Position = getBorderBoxCenter({
    reason,
    impact,
    draggable,
    draggables,
    droppable,
  });

  const offset: Position = subtract(
    newBorderBoxClientCenter,
    draggable.client.borderBox.center,
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
