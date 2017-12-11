// @flow
import getCollectionOrder from './get-collection-order';
import Perf from 'react-addons-perf';
import type{
  DraggableId,
  DroppableId,
  DroppableDescriptor,
  DraggableDescriptor,
  DraggableDimension,
  DroppableDimension,
  Position,
  State as AppState,
} from '../../types';
import type {
  Marshal,
  Callbacks,
  GetDraggableDimensionFn,
  DroppableCallbacks,
  OrderedCollectionList,
  OrderedDimensionList,
  UnknownDimensionType,
  UnknownDescriptorType,
  DroppableEntry,
  DraggableEntry,
  DroppableEntryMap,
  DraggableEntryMap,
} from './dimension-marshal-types';

type Collection = {|
  // item that is dragging
  draggable: DraggableDescriptor,
  // ordered list based on distance from starting draggable
  toBeCollected: OrderedCollectionList,
  // Dimensions that have been collected from components
  // but have not yet been published to the store
  toBePublishedBuffer: OrderedDimensionList,
  // toBeUnpublishedBuffer: OrderedCollectionList,
  // Dimensions that have already been collected
  collected: OrderedCollectionList,
|}

// Not using exact type to allow spread to create a new state object
type State = {
  droppables: DroppableEntryMap,
  draggables: DraggableEntryMap,
  collection: ?Collection,
}

type ToBePublished = {|
  draggables: DraggableDimension[],
  droppables: DroppableDimension[],
|}

const collectionSize: number = 2;

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

    const draggables: DraggableEntryMap = {
      ...state.draggables,
      [id]: entry,
    };

    setState({
      ...state,
      draggables,
    });

    if (!state.collection) {
      return;
    }

    // currently collecting - publish!
    console.log('publishing droppable mid collection');
    const dimension: DraggableDimension = entry.getDimension();
    callbacks.publishDraggables([dimension]);
  };

  const registerDroppable = (
    descriptor: DroppableDescriptor,
    droppableCallbacks: DroppableCallbacks,
  ) => {
    const id: DroppableId = descriptor.id;

    if (state.droppables[id]) {
      console.error(`Cannot register Droppable with id ${id} as one is already registered`);
      return;
    }

    const entry: DroppableEntry = {
      descriptor,
      callbacks: droppableCallbacks,
    };

    const droppables: DroppableEntryMap = {
      ...state.droppables,
      [id]: entry,
    };

    setState({
      ...state,
      droppables,
    });

    if (!state.collection) {
      return;
    }

    // currently collecting - publish!
    console.log('publishing droppable mid collection');
    const dimension: DroppableDimension = entry.callbacks.getDimension();
    callbacks.publishDroppables([dimension]);
  };

  const unregisterDraggable = (id: DraggableId) => {
    if (!state.draggables[id]) {
      console.error(`Cannot unregister Draggable with id ${id} as as it is not registered`);
      return;
    }
    delete state.draggables[id];

    if (!state.collection) {

    }

    // todo: unpublished buffer
    // unpublishDraggable();
  };

  const unregisterDroppable = (id: DroppableId) => {
    if (!state.droppables[id]) {
      console.error(`Cannot unregister Droppable with id ${id} as as it is not registered`);
      return;
    }
    delete state.droppables[id];

    if (!state.collection) {

    }

    // TODO: unpublished buffer
    // callbacks.unpublishDroppable(id);
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
      const toBePublishedBuffer: OrderedDimensionList = collection.toBePublishedBuffer;

      // if there are dimensions from the previous frame in the buffer - publish them

      if (toBePublishedBuffer.length) {
        // Perf.start();
        console.time('flushing buffer');
        const toBePublished: ToBePublished = toBePublishedBuffer.reduce(
          (previous: ToBePublished, dimension: UnknownDimensionType): ToBePublished => {
            // is a draggable
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

        // Need to request droppables to start listening to scrolling
        toBePublished.droppables.forEach((dimension: DroppableDimension) => {
          const entry: DroppableEntry = state.droppables[dimension.descriptor.id];
          entry.callbacks.watchScroll(callbacks.updateDroppableScroll);
        });

        console.timeEnd('flushing buffer');
        // Perf.stop();
        // const measurements = Perf.getLastMeasurements();
        // Perf.printInclusive(measurements);

        // clear the buffer
        const newCollection: Collection = {
          // clear the buffer
          toBePublishedBuffer: [],
          // keep everything else the same
          draggable: collection.draggable,
          toBeCollected: collection.toBeCollected,
          collected: collection.collected,
        };

        setState({
          ...state,
          collection: newCollection,
        });

        collect();
        return;
      }

      // the buffer is empty: start collecting other dimensions
      // obtain targets and remove them from the array
      const newToBeCollected: OrderedCollectionList = toBeCollected.slice(0);
      const targets: OrderedCollectionList = newToBeCollected.splice(0, collectionSize);

      console.time('requesting dimensions');

      const additions: UnknownDimensionType[] = targets.map(
        (descriptor: UnknownDescriptorType): UnknownDimensionType => {
          // is a droppable
          if (descriptor.type) {
            return state.droppables[descriptor.id].callbacks.getDimension();
          }
          // is a draggable
          return state.draggables[descriptor.id].getDimension();
        }
      );

      console.timeEnd('requesting dimensions');

      const newCollection: Collection = {
        draggable: collection.draggable,
        // newly collected items have been added to the collected list
        collected: [...collection.collected, ...targets],
        // new list with targets removed
        toBeCollected: newToBeCollected,
        // collected items added to buffer
        toBePublishedBuffer: [...toBePublishedBuffer, ...additions],
      };

      setState({
        ...state,
        collection: newCollection,
      });

      // continue collecting
      collect();
    });
  };

  const startInitialCollection = (descriptor: DraggableDescriptor) => {
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

    // Get the minimum dimensions to start a drag
    const homeDimension: DroppableDimension = homeEntry.callbacks.getDimension();
    const draggableDimension: DraggableDimension = draggableEntry.getDimension();

    // publishing container first - although it is not strictly needed
    callbacks.publishDroppables([homeDimension]);
    callbacks.publishDraggables([draggableDimension]);
    // watching the scroll of the home droppable
    homeEntry.callbacks.watchScroll(callbacks.updateDroppableScroll);

    const initialCollection: Collection = {
      draggable: descriptor,
      published: [descriptor, homeEntry.descriptor],
      toBeCollected: [],
      toBePublishedBuffer: [],
    };

    setState({
      ...state,
      collection: initialCollection,
    });

    console.timeEnd('initial dimension publish');

    // After this initial publish a drag will start
    setTimeout(() => {
      const collection: ?Collection = state.collection;
      // Drag was cleaned during this timeout
      if (!collection) {
        return;
      }

      // The drag has started and we need to collect all the other dimensions
      const toBeCollected: OrderedCollectionList = getCollectionOrder({
        draggable: descriptor,
        home: homeEntry.descriptor,
        draggables: state.draggables,
        droppables: state.droppables,
      });

      const newCollection: Collection = {
        draggable: collection.draggable,
        published: collection.published,
        toBePublishedBuffer: collection.toBePublishedBuffer,
        toBeCollected,
      };

      setState({
        ...state,
        collection: newCollection,
      });

      // start collection loop
      collect();
    });
  };

  const stopCollecting = () => {
    if (!state.collection) {
      console.warn('not stopping dimension capturing as was not previously capturing');
      return;
    }

    // need to tell published droppables to stop watching the scroll
    state.collection.published.forEach((descriptor: UnknownDescriptorType) => {
      // do nothing if it was a draggable
      if (!descriptor.type) {
        return;
      }
      const entry: DroppableEntry = state.droppables[descriptor.id];
      entry.callbacks.unwatchScroll();
    });

    // clear the collection
    setState({
      ...state,
      collection: null,
    });
  };

  const onStateChange = (current: AppState, previous: AppState) => {
    const currentPhase: string = current.phase;
    const previousPhase: string = previous.phase;

    // Exit early if phase in unchanged
    if (currentPhase === previousPhase) {
      return;
    }

    if (currentPhase === 'COLLECTING_INITIAL_DIMENSIONS') {
      const descriptor: ?DraggableDescriptor = current.dimension.request;

      if (!descriptor) {
        console.error('could not find requested draggable id in state');
        callbacks.cancel();
        return;
      }

      startInitialCollection(descriptor);
    }

    // No need to collect any more as the user has finished interacting
    if (currentPhase === 'DROP_ANIMATING' || currentPhase === 'DROP_COMPLETE') {
      if (state.collection) {
        stopCollecting();
      }
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
