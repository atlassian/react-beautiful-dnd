// @flow
import type { Position } from 'css-box-model';
import type {
  DroppableDimension,
  Viewport,
  DragImpact,
  DimensionMap,
  DraggableDimension,
  DroppableId,
  OnLift,
  Combine,
} from '../../../types';
import whatIsDraggedOver from '../../droppable/what-is-dragged-over';
import { subtract } from '../../position';
import getClientBorderBoxCenter from '../../get-center-from-impact/get-client-border-box-center';
import didStartDisplaced from '../../starting-displaced/did-start-displaced';
import { tryGetCombine } from '../../get-impact-location';

type Args = {|
  impact: DragImpact,
  draggable: DraggableDimension,
  dimensions: DimensionMap,
  viewport: Viewport,
  onLift: OnLift,
|};

export default ({
  impact,
  draggable,
  dimensions,
  viewport,
  onLift,
}: Args): Position => {
  const { draggables, droppables } = dimensions;
  const droppableId: ?DroppableId = whatIsDraggedOver(impact);
  const destination: ?DroppableDimension = droppableId
    ? droppables[droppableId]
    : null;
  const home: DroppableDimension = droppables[draggable.descriptor.droppableId];

  const newClientCenter: Position = getClientBorderBoxCenter({
    impact,
    draggable,
    draggables,
    // if there is no destination, then we will be dropping back into the home
    onLift,
    droppable: destination || home,
    viewport,
  });

  const offset: Position = subtract(
    newClientCenter,
    draggable.client.borderBox.center,
  );

  const combine: ?Combine = tryGetCombine(impact);

  // When dropping with a merge we want to drop the dragging item
  // into the new home location of the target.
  // The target will move as a result of a drop if it started displaced
  if (combine && didStartDisplaced(combine.draggableId, onLift)) {
    return subtract(offset, onLift.displacedBy.point);
  }

  return offset;
};
