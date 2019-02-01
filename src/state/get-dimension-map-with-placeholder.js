// @flow
import {
  addPlaceholder,
  removePlaceholder,
} from './droppable/with-placeholder';
import whatIsDraggedOver from './droppable/what-is-dragged-over';
import type {
  DroppableDimension,
  DimensionMap,
  DraggableDimension,
  DragImpact,
  DroppableId,
} from '../types';
import patchDroppableMap from './patch-droppable-map';

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

  const isOver: ?DroppableId = whatIsDraggedOver(impact);

  if (!isOver) {
    return base;
  }

  // no need to add additional space to home droppable
  if (isOver === draggable.descriptor.droppableId) {
    // TODO: need to actually remove placeholder space!?
    return base;
  }

  const droppable: DroppableDimension = base.droppables[isOver];

  // already have a placeholder - nothing to do here!
  if (droppable.subject.withPlaceholder) {
    return base;
  }

  // Need to patch the existing droppable
  const patched: DroppableDimension = addPlaceholder(
    droppable,
    draggable.displaceBy,
    base.draggables,
  );

  return patchDroppableMap(base, patched);
};
