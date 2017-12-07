// @flow
import type {
  DraggableDescriptor,
  DroppableDescriptor,
  DraggableId,
  DroppableId,
} from '../../types';
import type {
  OrderedCollectionList,
  UnknownDescriptorType,
  DraggableEntryMap,
  DroppableEntryMap,
} from './dimension-marshal-types';

type Args = {|
  draggable: DraggableDescriptor,
  home: DroppableDescriptor,
  droppables: DroppableEntryMap,
  draggables: DraggableEntryMap,
|}

type EntryWithScore = {|
  descriptor: DraggableDescriptor | DroppableDescriptor,
  score: number,
|}

const scoreTable = (() => {
  const droppableChange: number = 2;

  return {
    draggable: {
      indexChange: 1,
      // needs to be collected after a droppable
      droppableChange: droppableChange + 1,
    },
    droppable: {
      indexChange: droppableChange,
    },
  };
})();

// It is the responsiblity of this function to create
// a single dimensional ordered list for dimensions to be collected.
// It is not the responsible of this function to return the home
// droppable or the draggable itself. These are collected in a previous phase
export default ({
  draggable,
  home,
  draggables,
  droppables,
}: Args): OrderedCollectionList => {
  // ## Rules:
  // Droppables need to be collected before their child Draggables
  // Do not return the draggable or home droppable

  // ## Priority:
  // Things that are more likely to be interacted with by a user need
  // to be be collected first.

  // ### Things that are most likely to occur:
  // - reordering within the same list
  // - moving into a similar index in another list

  // ## Weighted scoring
  // Items with the *lowest* weighted score will appear first in the list

  // ### Rules:
  // Draggables:
  // - Change in index from draggable = + 1 point per index change
  //     (Eg: draggable[index: 4] compared to draggable[index:6] would be 2 points)
  // - Change in index from draggable = + 3 points per index change
  //     This is one less than the change for Droppables so that the Droppable goes first
  //     (Eg: draggable in droppable[index:1] to draggable in droppable[index:3] would be 6 points)
  // Droppables
  // - Change in index from home droppable = + 2 points per index change
  //     (Eg: droppable[index:1] compared to droppable[index:3] would be 4 points)

  const draggablesWithScore: EntryWithScore[] = Object.keys(draggables)
    .map((id: DraggableId): DraggableDescriptor => draggables[id].descriptor)
    // remove the original draggable from the list
    .filter((descriptor: DraggableDescriptor): boolean => descriptor.id !== draggable.id)
    // remove draggables that do not have the same droppable type
    .filter((descriptor: DraggableDescriptor): boolean => {
      const droppable: DroppableDescriptor = droppables[descriptor.droppableId].descriptor;
      return droppable.type === home.type;
    })
    // add score
    .map((descriptor: DraggableDescriptor): EntryWithScore => {
      // 1 point for every index difference
      const indexDiff: number = Math.abs(draggable.index - descriptor.index);
      const indexScore: number = indexDiff * scoreTable.draggable.indexChange;

      // 3 points for every droppable index difference
      const droppable: DroppableDescriptor = droppables[descriptor.droppableId].descriptor;
      const droppableIndexDiff: number = Math.abs(home.index - droppable.index);
      const droppableScore: number = droppableIndexDiff * scoreTable.draggable.droppableChange;

      const score: number = indexScore + droppableScore;

      return {
        descriptor,
        score,
      };
    });

  const droppablesWithScore: EntryWithScore[] = Object.keys(droppables)
    .map((id: DroppableId): DroppableDescriptor => droppables[id].descriptor)
    // remove the home droppable from the list
    .filter((descriptor: DroppableDescriptor): boolean => descriptor.id !== home.id)
    // remove droppables with a different type
    .filter((descriptor: DroppableDescriptor): boolean => {
      const droppable: DroppableDescriptor = droppables[descriptor.id].descriptor;
      return droppable.type === home.type;
    })
    // add score
    .map((descriptor: DroppableDescriptor) => {
      const indexDiff: number = Math.abs(home.index - descriptor.index);
      // two points for every difference in index
      const score: number = indexDiff * scoreTable.droppable.indexChange;

      return {
        descriptor,
        score,
      };
    });

  const combined: OrderedCollectionList = [...draggablesWithScore, ...droppablesWithScore]
    // descriptors with the lowest score go first
    .sort((a: EntryWithScore, b: EntryWithScore) => a.score - b.score)
    .map((item: EntryWithScore): UnknownDescriptorType => item.descriptor);

  return combined;
};
