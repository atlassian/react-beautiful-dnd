// @flow
import {
  addPlaceholder,
  removePlaceholder,
} from './droppable/with-placeholder';
import whatIsDraggedOver from './droppable/what-is-dragged-over';
import type {
  DroppableDimension,
  DraggableDimensionMap,
  DroppableDimensionMap,
  DraggableDimension,
  DragImpact,
  DroppableId,
} from '../types';
import patchDroppableMap from './patch-droppable-map';
import isHomeOf from './droppable/is-home-of';

type ClearArgs = {|
  previousImpact: DragImpact,
  impact: DragImpact,
  droppables: DroppableDimensionMap,
|};

const clearUnusedPlaceholder = ({
  previousImpact,
  impact,
  droppables,
}: ClearArgs): DroppableDimensionMap => {
  const last: ?DroppableId = whatIsDraggedOver(previousImpact);
  const now: ?DroppableId = whatIsDraggedOver(impact);

  if (!last) {
    return droppables;
  }

  // no change - can keep the last state
  if (last === now) {
    return droppables;
  }

  const lastDroppable: DroppableDimension = droppables[last];

  // nothing to clear
  if (!lastDroppable.subject.withPlaceholder) {
    return droppables;
  }

  const updated: DroppableDimension = removePlaceholder(lastDroppable);
  return patchDroppableMap(droppables, updated);
};

type Args = {|
  draggable: DraggableDimension,
  draggables: DraggableDimensionMap,
  droppables: DroppableDimensionMap,
  impact: DragImpact,
  previousImpact: DragImpact,
|};

export default ({
  draggable,
  draggables,
  droppables,
  previousImpact,
  impact,
}: Args): DroppableDimensionMap => {
  const cleaned: DroppableDimensionMap = clearUnusedPlaceholder({
    previousImpact,
    impact,
    droppables,
  });

  const isOver: ?DroppableId = whatIsDraggedOver(impact);

  if (!isOver) {
    return cleaned;
  }

  const droppable: DroppableDimension = droppables[isOver];

  // no need to add additional space to home droppable
  if (isHomeOf(draggable, droppable)) {
    return cleaned;
  }

  // already have a placeholder - nothing to do here!
  if (droppable.subject.withPlaceholder) {
    return cleaned;
  }

  // Need to patch the existing droppable
  const patched: DroppableDimension = addPlaceholder(
    droppable,
    draggable,
    draggables,
  );

  return patchDroppableMap(cleaned, patched);
};
