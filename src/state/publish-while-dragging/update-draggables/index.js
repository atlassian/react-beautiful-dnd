// @flow
import type {
  DraggableId,
  DroppableDimension,
  DroppableDimensionMap,
  DraggableDimensionMap,
  DraggableDimension,
  Viewport,
} from '../../../types';
import adjustExistingForAdditionsAndRemovals from './adjust-existing-for-additions-and-removals';
import adjustAdditionsForScrollChanges from './adjust-additions-for-scroll-changes';
import adjustAdditionsForCollapsedHome from './adjust-additions-for-collapsed-home';
import { toDraggableMap } from '../../dimension-structures';

type Args = {|
  updatedDroppables: DroppableDimensionMap,
  criticalId: DraggableId,
  existing: DraggableDimensionMap,
  additions: DraggableDimension[],
  removals: DraggableId[],
  viewport: Viewport,
|};

export default ({
  updatedDroppables,
  criticalId,
  existing: unmodifiedExisting,
  additions: unmodifiedAdditions,
  removals,
  viewport,
}: Args): DraggableDimensionMap => {
  // Phase 1: update existing draggables
  const existing: DraggableDimensionMap = adjustExistingForAdditionsAndRemovals(
    {
      droppables: updatedDroppables,
      existing: unmodifiedExisting,
      additions: unmodifiedAdditions,
      removals,
      viewport,
    },
  );

  // Phase 2: update added draggables

  const dragging: DraggableDimension = existing[criticalId];
  const home: DroppableDimension =
    updatedDroppables[dragging.descriptor.droppableId];

  const scrolledAdditions: DraggableDimension[] = adjustAdditionsForScrollChanges(
    {
      additions: unmodifiedAdditions,
      // using our already adjusted droppables as they have the correct scroll changes
      updatedDroppables,
      viewport,
    },
  );

  const additions: DraggableDimension[] = adjustAdditionsForCollapsedHome({
    additions: scrolledAdditions,
    dragging,
    home,
    viewport,
  });

  const map: DraggableDimensionMap = {
    ...existing,
    ...toDraggableMap(additions),
  };

  // Phase 3: clear removed draggables

  removals.forEach((id: DraggableId) => {
    delete map[id];
  });

  return map;
};

// Adjust the added draggables
