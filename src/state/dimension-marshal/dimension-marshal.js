// @flow
import type {
  DraggableId,
  DroppableId,
  DroppableDescriptor,
  DraggableDescriptor,
  DraggableDimension,
  DroppableDimension,
  State as AppState,
  Phase,
} from '../../types';
import type {
  DimensionMarshal,
  Callbacks,
  GetDraggableDimensionFn,
  DroppableCallbacks,
  UnknownDimensionType,
  UnknownDescriptorType,
  DroppableEntry,
  DraggableEntry,
  DroppableEntryMap,
  DraggableEntryMap,
} from './dimension-marshal-types';

type Timers = {|
  liftTimeoutId: ?number,
  collectionFrameId: ?number,
|}

type State = {|
  droppables: DroppableEntryMap,
  draggables: DraggableEntryMap,
  isCollecting: boolean,
  timers: Timers,
|}

type ToBePublished = {|
  draggables: DraggableDimension[],
  droppables: DroppableDimension[],
|}

const noTimers: Timers = {
  liftTimeoutId: null,
  collectionFrameId: null,
};

export default (callbacks: Callbacks) => {
  let state: State = {
    droppables: {},
    draggables: {},
    isCollecting: false,
    timers: noTimers,
  };

  const setState = (partial: Object) => {
    const newState: State = {
      ...state,
      ...partial,
    };
    state = newState;
  };

  const error = (...args: mixed[]) => {
    console.error(...args);
    callbacks.cancel();
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
      draggables,
    });

    if (!state.isCollecting) {
      return;
    }

    // if a draggable is published while collecting - publishing it immediately

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
      droppables,
    });

    if (!state.isCollecting) {
      return;
    }

    // if a droppable is published while collecting - publishing it immediately
    const dimension: DroppableDimension = entry.callbacks.getDimension();
    callbacks.publishDroppables([dimension]);
    entry.callbacks.watchScroll(callbacks.updateDroppableScroll);
  };

  const unregisterDraggable = (id: DraggableId) => {
    if (!state.draggables[id]) {
      console.error(`Cannot unregister Draggable with id ${id} as as it is not registered`);
      return;
    }
    const newMap: DraggableEntryMap = {
      ...state.draggables,
    };
    delete newMap[id];

    setState({
      draggables: newMap,
    });

    if (!state.collection) {
      return;
    }

    console.warn('currently not supporting unmounting a Draggable during a drag');
  };

  const unregisterDroppable = (id: DroppableId) => {
    if (!state.droppables[id]) {
      console.error(`Cannot unregister Droppable with id ${id} as as it is not registered`);
      return;
    }
    const newMap: DroppableEntryMap = {
      ...state.droppables,
    };
    delete newMap[id];

    setState({
      droppables: newMap,
    });

    if (!state.collection) {
      return;
    }

    // TODO: actually unpublish
    console.warn('currently not supporting unmounting a Droppable during a drag');
  };

  const setFrameId = (frameId: ?number) => {
    const timers: Timers = {
      collectionFrameId: frameId,
      liftTimeoutId: null,
    };

    setState({
      timers,
    });
  };

  const collect = (toBeCollected: UnknownDescriptorType[]) => {
    // Phase 1: collect dimensions in a single frame
    const collectFrameId: number = requestAnimationFrame(() => {
      const toBePublishedBuffer: UnknownDimensionType[] = toBeCollected.map(
        (descriptor: UnknownDescriptorType): UnknownDimensionType => {
          // is a droppable
          if (descriptor.type) {
            return state.droppables[descriptor.id].callbacks.getDimension();
          }
          // is a draggable
          return state.draggables[descriptor.id].getDimension();
        }
      );

      // Phase 2: publish all dimensions to the store
      const publishFrameId: number = requestAnimationFrame(() => {
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

        // need to watch the scroll on each droppable
        toBePublished.droppables.forEach((dimension: DroppableDimension) => {
          const entry: DroppableEntry = state.droppables[dimension.descriptor.id];
          entry.callbacks.watchScroll(callbacks.updateDroppableScroll);
        });

        setFrameId(null);
      });

      setFrameId(publishFrameId);
    });

    setFrameId(collectFrameId);
  };

  const startCollecting = (descriptor: DraggableDescriptor) => {
    if (state.isCollecting) {
      error('Cannot start capturing dimensions for a drag it is already dragging');
      return;
    }

    const draggables: DraggableEntryMap = state.draggables;
    const droppables: DroppableEntryMap = state.droppables;

    const draggableEntry: ?DraggableEntry = draggables[descriptor.id];

    if (!draggableEntry) {
      error(`Cannot find Draggable with id ${descriptor.id} to start collecting dimensions`);
      return;
    }

    const homeEntry: ?DroppableEntry = droppables[draggableEntry.descriptor.droppableId];

    if (!homeEntry) {
      error(`Cannot find home Droppable [id:${draggableEntry.descriptor.droppableId}] for Draggable [id:${descriptor.id}]`);
      return;
    }

    // Get the minimum dimensions to start a drag
    const home: DroppableDimension = homeEntry.callbacks.getDimension();
    const draggable: DraggableDimension = draggableEntry.getDimension();
    // Publishing dimensions
    callbacks.publishDroppables([home]);
    callbacks.publishDraggables([draggable]);
    // Watching the scroll of the home droppable
    homeEntry.callbacks.watchScroll(callbacks.updateDroppableScroll);

    const draggablesToBeCollected: DraggableDescriptor[] =
      Object.keys(draggables)
        .map((id: DraggableId): DraggableDescriptor => draggables[id].descriptor)
        // remove the original draggable from the list
        .filter((item: DraggableDescriptor): boolean => item.id !== descriptor.id)
        // remove draggables that do not have the same droppable type
        .filter((item: DraggableDescriptor): boolean => {
          const droppable: DroppableDescriptor = droppables[item.droppableId].descriptor;
          return droppable.type === home.descriptor.type;
        });

    const droppablesToBeCollected: DroppableDescriptor[] =
      Object.keys(droppables)
        .map((id: DroppableId): DroppableDescriptor => droppables[id].descriptor)
        // remove the home droppable from the list
        .filter((item: DroppableDescriptor): boolean => item.id !== home.descriptor.id)
      // remove droppables with a different type
        .filter((item: DroppableDescriptor): boolean => {
          const droppable: DroppableDescriptor = droppables[item.id].descriptor;
          return droppable.type === home.descriptor.type;
        });

    const toBeCollected: UnknownDescriptorType[] = [
      ...droppablesToBeCollected,
      ...draggablesToBeCollected,
    ];

    // After this initial publish a drag will start
    const liftTimeoutId: number = setTimeout(() => collect(toBeCollected));

    const timers: Timers = {
      liftTimeoutId,
      collectionFrameId: null,
    };

    setState({
      timers,
      isCollecting: true,
    });
  };

  const stopCollecting = () => {
    if (!state.isCollecting) {
      console.warn('not stopping dimension capturing as was not previously capturing');
      return;
    }

    // Tell all droppables to stop watching scroll
    // all good if they where not already listening
    Object.keys(state.droppables)
      .forEach((id: DroppableId) => state.droppables[id].callbacks.unwatchScroll());

    if (state.timers.liftTimeoutId) {
      clearTimeout(state.timers.liftTimeoutId);
    }

    if (state.timers.collectionFrameId) {
      cancelAnimationFrame(state.timers.collectionFrameId);
    }

    // clear the collection
    setState({
      isCollecting: false,
      timers: noTimers,
    });
  };

  const onStateChange = (current: AppState) => {
    const phase: Phase = current.phase;

    if (phase === 'COLLECTING_INITIAL_DIMENSIONS') {
      const descriptor: ?DraggableDescriptor = current.dimension.request;

      if (!descriptor) {
        console.error('could not find requested draggable id in state');
        callbacks.cancel();
        return;
      }

      startCollecting(descriptor);
      return;
    }

    // No need to collect any more as the user has finished interacting
    if (phase === 'DROP_ANIMATING' || phase === 'DROP_COMPLETE') {
      if (state.isCollecting) {
        stopCollecting();
      }
      return;
    }

    // drag potentially cleaned
    if (phase === 'IDLE') {
      if (state.isCollecting) {
        stopCollecting();
      }
    }
  };

  const marshal: DimensionMarshal = {
    registerDraggable,
    registerDroppable,
    unregisterDraggable,
    unregisterDroppable,
    onStateChange,
  };

  return marshal;
};
