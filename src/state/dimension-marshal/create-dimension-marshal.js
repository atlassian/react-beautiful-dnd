// @flow
import type{
  DraggableId,
  DroppableId,
  TypeId,
  DroppableDescriptor,
  DraggableDescriptor,
  DraggableDimension,
  DroppableDimension,
} from '../../types';
import type { Marshal } from './dimension-marshal-types';

type GetDraggableDimensionFn = () => DraggableDimension;
type GetDroppableDimensionFn = () => DroppableDimension;

type DroppableEntry = {|
  descriptor: DroppableDescriptor,
  getDimension: GetDroppableDimensionFn,
|}

type DraggableEntry = {|
  descriptor: DraggableDescriptor,
  getDimension: GetDraggableDimensionFn,
|}

type DraggableEntryMap = {
  [key: DraggableId]: DraggableEntry,
}

type DropppableEntryMap = {
  [key: DroppableId]: DroppableEntry,
}

type OrderedCollectionList = Array<DraggableDescriptor | DroppableDescriptor>;

type Collection = {|
  // item that is dragging
  draggable: DraggableDescriptor,
  // ordered list based on distance from starting draggable
  toBeCollected: OrderedCollectionList
|}

type MarshalCallbacks = {|
  publishDraggables: (DraggableDimension[]) => void,
  publishDroppables: (DroppableDimension[]) => void,
  cancel: () => void,
|}

type State = {|
  droppables: DropppableEntryMap,
  draggables: DraggableEntryMap,
  isCollecting: boolean,
  collection: ?Collection,
|}

// TODO: move into own file
type GetCollectionOrderFn = {|
  draggable: DraggableDescriptor,
  home: DroppableDescriptor,
  droppables: DropppableEntryMap,
  draggables: DraggableEntryMap,
|}

type DescriptorWithScore = {|
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
const getCollectionOrder = ({
  draggable,
  home,
  draggables,
  droppables,
}: GetCollectionOrderFn): OrderedCollectionList => {
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

  const draggablesWithScore: DescriptorWithScore[] = Object.keys(draggables)
    .map((id: DraggableId): DraggableDescriptor => draggables[id].descriptor)
    // remove the original draggable from the list
    .filter((descriptor: DraggableDescriptor): boolean => descriptor.id !== draggable.id)
    // remove draggables that do not have the same droppable type
    .filter((descriptor: DraggableDescriptor): boolean => {
      const droppable: DroppableDescriptor = droppables[descriptor.droppableId].descriptor;
      return droppable.type === home.type;
    })
    // add score
    .map((descriptor: DraggableDescriptor): DescriptorWithScore => {
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

  const droppablesWithScore: DescriptorWithScore[] = Object.keys(droppables)
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
    .sort((a: DescriptorWithScore, b: DescriptorWithScore) => a.score - b.score)
    .map((item: DescriptorWithScore) => item.descriptor);

  return combined;
};

export default (callbacks: MarshalCallbacks) => {
  const initial: State = {
    droppables: {},
    draggables: {},
    collection: null,
    isCollecting: false,
  };

  const state: State = initial;

  const registerDraggable = (
    descriptor: DraggableDescriptor,
    getDimension: GetDraggableDimensionFn
  ) => {
    const id: DraggableId = descriptor.id;

    if (state.draggables[id]) {
      console.error(`Cannot register Draggable with id ${id} as one is already registered`);
      return;
    }

    state.draggables[id] = {
      descriptor,
      getDimension,
    };
  };

  const registerDroppable = (
    descriptor: DroppableDescriptor,
    getDimension: GetDroppableDimensionFn
  ) => {
    const id: DroppableId = descriptor.id;

    if (state.droppables[id]) {
      console.error(`Cannot register Droppable with id ${id} as one is already registered`);
      return;
    }

    state.droppables[id] = {
      descriptor,
      getDimension,
    };
  };

  const unregisterDraggable = (id: DraggableId) => {
    if (!state.draggables[id]) {
      console.error(`Cannot unregister Draggable with id ${id} as as it is not registered`);
      return;
    }
    delete state.draggables[id];
  };

  const unregisterDroppable = (id: DroppableId) => {
    if (!state.droppables[id]) {
      console.error(`Cannot unregister Droppable with id ${id} as as it is not registered`);
      return;
    }
    delete state.droppables[id];
  };

  const start = (id: DraggableId) => {
    if (state.dragging) {
      console.error('Cannot start capturing dimensions for a drag it is already dragging');
      callbacks.cancel();
      return;
    }

    const draggableEntry: ?DraggableEntry = state.draggables[id];

    if (!draggableEntry) {
      console.error(`Cannot find Draggable with id ${id} to start collecting dimensions`);
      callbacks.cancel();
      return;
    }

    const droppableEntry: ?DroppableEntry = state.droppables[draggableEntry.descriptor.droppableId];

    if (!droppableEntry) {
      console.error(`Cannot find home Droppable [id:${draggableEntry.descriptor.droppableId}] for Draggable [id:${id}]`);
      callbacks.cancel();
      return;
    }

    // We are now registering that a drag is occurring
    state.isCollecting = true;

    // Get the minimum dimensions to start a drag
    const home: DroppableDimension = droppableEntry.getDimension();
    const draggable: DraggableDimension = draggableEntry.getDimension();

    callbacks.publishDroppables([home]);
    callbacks.publishDraggables([draggable]);

    // Drag will now have started
    // - need to figure out the weighted distance to each dimension
  };

  const stop = () => {
    if (!state.isCollecting) {
      console.error('cannot stop capturing dimensions as ');
    }
  };

  const marshal: Marshal = {
    registerDraggable,
    registerDroppable,
    unregisterDraggable,
    unregisterDroppable,
    start,
    stop,
  };

  return marshal;
};
