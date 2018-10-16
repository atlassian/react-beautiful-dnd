// @flow
import type { Position } from 'css-box-model';
import {
  addPlaceholder,
  removePlaceholder,
} from '../../../droppable/with-placeholder';
import { patch } from '../../../position';
import shouldUsePlaceholder from '../../../droppable/should-use-placeholder';
import whatIsDraggedOver from '../../../droppable/what-is-dragged-over';
import type {
  DroppableDimension,
  DimensionMap,
  DraggableDimension,
  DragImpact,
  DroppableId,
} from '../../../../types';
import patchDroppableMap from '../../../patch-droppable-map';

type ClearArgs = {|
  previousImpact: DragImpact,
  impact: DragImpact,
  dimensions: DimensionMap,
|};

const clearUnusedPlaceholder = ({
  previousImpact,
  impact,
  dimensions,
}: ClearArgs): DimensionMap => {
  const last: ?DroppableId = whatIsDraggedOver(previousImpact);
  const now: ?DroppableId = whatIsDraggedOver(impact);

  if (!last) {
    return dimensions;
  }

  // no change - can keep the last state
  if (last === now) {
    return dimensions;
  }

  const lastDroppable: DroppableDimension = dimensions.droppables[last];

  // nothing to clear
  if (!lastDroppable.subject.withPlaceholder) {
    return dimensions;
  }

  const updated: DroppableDimension = removePlaceholder(lastDroppable);
  return patchDroppableMap(dimensions, updated);
};

type Args = {|
  dimensions: DimensionMap,
  draggable: DraggableDimension,
  impact: DragImpact,
  previousImpact: DragImpact,
|};

export default ({
  dimensions,
  previousImpact,
  draggable,
  impact,
}: Args): DimensionMap => {
  const base: DimensionMap = clearUnusedPlaceholder({
    previousImpact,
    impact,
    dimensions,
  });

  const usePlaceholder: boolean = shouldUsePlaceholder(
    draggable.descriptor,
    impact,
  );

  if (!usePlaceholder) {
    return base;
  }

  const droppableId: ?DroppableId = whatIsDraggedOver(impact);
  if (!droppableId) {
    return base;
  }
  const droppable: DroppableDimension = base.droppables[droppableId];

  // already have a placeholder - nothing to do here!
  if (droppable.subject.withPlaceholder) {
    return base;
  }

  const placeholderSize: Position = patch(
    droppable.axis.line,
    draggable.displaceBy[droppable.axis.line],
  );

  // Need to patch the existing droppable
  const patched: DroppableDimension = addPlaceholder(
    droppable,
    placeholderSize,
    base.draggables,
  );

  return patchDroppableMap(base, patched);
};
