// @flow
import type{
  DraggableId,
  DroppableId,
  DroppableDescriptor,
  DraggableDescriptor,
  DraggableDimension,
  DroppableDimension,
  State as AppState,
} from '../../types';
import type {
  Marshal,
  Callbacks,
  GetDraggableDimensionFn,
  GetDroppableDimensionFn,
} from './dimension-marshal-types';

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

type DroppableEntryMap = {
  [key: DroppableId]: DroppableEntry,
}

type UnknownDescriptorType = DraggableDescriptor | DroppableDescriptor;
type UnknownDimensionType = DraggableDimension | DroppableDimension;

type OrderedCollectionList = Array<UnknownDescriptorType>;

type Collection = {|
  // item that is dragging
  draggable: DraggableDescriptor,
  // ordered list based on distance from starting draggable
  toBeCollected: OrderedCollectionList,
  // Dimensions that have been collected from components
  // but have not yet been published to the store
  toBePublishedBuffer: Array<UnknownDimensionType>
|}

// Not using exact type to allow spread to create a new state object
type State = {
  droppables: DroppableEntryMap,
  draggables: DraggableEntryMap,
  collection: ?Collection,
}

// TODO: move into own file
type GetCollectionOrderFn = {|
  draggable: DraggableDescriptor,
  home: DroppableDescriptor,
  droppables: DroppableEntryMap,
  draggables: DraggableEntryMap,
|}

type EntryWithScore = {|
  descriptor: DraggableDescriptor | DroppableDescriptor,
  score: number,
|}

type ToBePublished = {|
  draggables: DraggableDimension[],
  droppables: DroppableDimension[],
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

const collectionSize: number = 4;

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

export default (callbacks: Callbacks) => {
  let state: State = {
    droppables: {},
    draggables: {},
    collection: null,
  };

  const setState = (newState: State) => {
    state = newState;
  };

  const registerDraggable = (
    descriptor: DraggableDescriptor,
    getDimension: GetDraggableDimensionFn
  ) => {
    const id: DraggableId = descriptor.id;

    if (state.draggables[id]) {
      console.error(`Cannot register Draggable with id ${id} as one is already registered`);
      return;
    }

    const entry: DraggableEntry = {
      descriptor,
      getDimension,
    };

    console.log('publishing draggable entry', entry);

    const draggables: DraggableEntryMap = {
      ...state.draggables,
      [id]: entry,
    };

    setState({
      ...state,
      draggables,
    });
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

    const entry: DroppableEntry = {
      descriptor,
      getDimension,
    };

    console.log('publishing droppable entry', entry);

    const droppables: DroppableEntryMap = {
      ...state.droppables,
      [id]: entry,
    };

    setState({
      ...state,
      droppables,
    });
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

  const collect = () => {
    // no longer collecting
    if (!state.collection) {
      return;
    }

    // All finished!
    if (!state.collection.toBeCollected.length && !state.collection.toBePublishedBuffer.length) {
      return;
    }

    // Splitting the act of
    // - collecting dimensions(expensive) and
    // - publishing them into the store(expensive)
    // into two seperate frames.
    //
    requestAnimationFrame(() => {
      const collection: ?Collection = state.collection;
      // within the frame duration we where told to no longer collect
      if (collection == null) {
        return;
      }

      const toBeCollected: OrderedCollectionList = collection.toBeCollected;
      const toBePublishedBuffer: Array<UnknownDimensionType> = collection.toBePublishedBuffer;

      // if there are dimensions from the previous frame in the buffer - publish them

      if (toBePublishedBuffer.length) {
        const toBePublished: ToBePublished = toBePublishedBuffer.reduce(
          (previous: ToBePublished, dimension: UnknownDimensionType): ToBePublished => {
            if (dimension.placeholder) {
              previous.draggables.push(dimension);
            } else {
              previous.droppables.push(dimension);
            }
            return previous;
          }, { draggables: [], droppables: [] }
        );

        callbacks.publishDroppables(toBePublished.droppables);
        callbacks.publishDraggables(toBePublished.draggables);

        // clear the buffer
        const newCollection: Collection = {
          draggable: collection.draggable,
          toBeCollected: collection.toBeCollected,
          // clear the buffer
          toBePublishedBuffer: [],
        };

        setState({
          ...state,
          collection: newCollection,
        });

        // continue collecting
        collect();
      }

      // the buffer is empty: start collecting other dimensions
      // obtain targets and remove them from the array
      const newToBeCollected: OrderedCollectionList = toBeCollected.slice(0);
      const targets: OrderedCollectionList = newToBeCollected.splice(0, collectionSize);

      const newToBePublishedBuffer: UnknownDimensionType[] = targets.map(
        (descriptor: UnknownDescriptorType): UnknownDimensionType => {
          // is a droppable
          if (descriptor.type) {
            return state.droppables[descriptor.id].getDimension();
          }
          // is a draggable
          return state.draggables[descriptor.id].getDimension();
        }
      );

      const newCollection: Collection = {
        draggable: collection.draggable,
        toBeCollected: newToBeCollected,
        toBePublishedBuffer: newToBePublishedBuffer,
      };

      setState({
        ...state,
        collection: newCollection,
      });

      // continue collecting
      collect();
    });
  };

  const startCollection = (descriptor: DraggableDescriptor) => {
    if (state.dragging) {
      console.error('Cannot start capturing dimensions for a drag it is already dragging');
      callbacks.cancel();
      return;
    }

    const draggableEntry: ?DraggableEntry = state.draggables[descriptor.id];

    if (!draggableEntry) {
      console.error(`Cannot find Draggable with id ${descriptor.id} to start collecting dimensions`);
      callbacks.cancel();
      return;
    }

    const homeEntry: ?DroppableEntry = state.droppables[draggableEntry.descriptor.droppableId];

    if (!homeEntry) {
      console.error(`Cannot find home Droppable [id:${draggableEntry.descriptor.droppableId}] for Draggable [id:${descriptor.id}]`);
      callbacks.cancel();
      return;
    }

    const emptyCollection: Collection = {
      draggable: draggableEntry.descriptor,
      toBeCollected: [],
      toBePublishedBuffer: [],
    };

    setState({
      ...state,
      collection: emptyCollection,
    });

    // Get the minimum dimensions to start a drag
    const homeDimension: DroppableDimension = homeEntry.getDimension();
    const draggableDimension: DraggableDimension = draggableEntry.getDimension();

    // publishing container first
    callbacks.publishDroppables([homeDimension]);
    callbacks.publishDraggables([draggableDimension]);

    // After this initial publish a drag will start
    setTimeout(() => {
      // Drag was cleanled during this timeout
      if (!state.collection) {
        return;
      }

      // The drag has started and we need to collect all the other dimensions

      const toBeCollected: OrderedCollectionList =
        getCollectionOrder({
          draggable: draggableEntry.descriptor,
          home: homeEntry.descriptor,
          draggables: state.draggables,
          droppables: state.droppables,
        });

      const collection: Collection = {
        draggable: draggableEntry.descriptor,
        toBeCollected,
        toBePublishedBuffer: [],
      };

      setState({
        ...state,
        collection,
      });

      collect();
    });
  };

  const stopCollecting = () => {
    if (!state.collection) {
      console.warn('not stopping dimension capturing as was not previously capturing');
      return;
    }

    const newState: State = {
      ...state,
      collection: null,
    };

    setState(newState);
  };

  const onStateChange = (current: AppState, previous: AppState) => {
    const currentPhase: string = current.phase;
    const previousPhase: string = previous.phase;

    // Exit early if phase in unchanged
    if (currentPhase === previousPhase) {
      return;
    }

    if (currentPhase === 'COLLECTING_DIMENSIONS') {
      const descriptor: ?DraggableDescriptor = current.dimension.request;

      if (!descriptor) {
        console.error('could not find requested draggable id in state');
        callbacks.cancel();
        return;
      }

      startCollection(descriptor);
    }

    // No need to collect any more as the user has finished interacting
    if (currentPhase === 'DROP_ANIMATING' || currentPhase === 'DROP_COMPLETE') {
      stopCollecting();
      return;
    }

    // drag potentially cleanled
    if (currentPhase === 'IDLE') {
      if (state.collection) {
        stopCollecting();
      }
    }
  };

  const marshal: Marshal = {
    registerDraggable,
    registerDroppable,
    unregisterDraggable,
    unregisterDroppable,
    onStateChange,
  };

  return marshal;
};
