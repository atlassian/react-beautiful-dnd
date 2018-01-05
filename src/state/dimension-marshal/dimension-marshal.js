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
  Position,
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

type State = {|
  // long lived
  droppables: DroppableEntryMap,
  draggables: DraggableEntryMap,
  isCollecting: boolean,
  request: ?DraggableId,
  frameId: ?number,
|}

type ToBePublished = {|
  draggables: DraggableDimension[],
  droppables: DroppableDimension[],
|}

export default (callbacks: Callbacks) => {
  let state: State = {
    droppables: {},
    draggables: {},
    isCollecting: false,
    request: null,
    frameId: null,
  };

  const setState = (partial: Object) => {
    const newState: State = {
      ...state,
      ...partial,
    };
    state = newState;
  };

  const cancel = (...args: mixed[]) => {
    console.error(...args);
    // eslint-disable-next-line no-use-before-define
    stopCollecting();
    callbacks.cancel();
  };

  const registerDraggable = (
    descriptor: DraggableDescriptor,
    getDimension: GetDraggableDimensionFn
  ) => {
    const id: DraggableId = descriptor.id;

    // Cannot register a draggable if no entry exists for the droppable
    if (!state.droppables[descriptor.droppableId]) {
      console.error(`Cannot register Draggable ${id} as there is no entry for the Droppable ${descriptor.droppableId}`);
      return;
    }

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
    entry.callbacks.watchScroll();
  };

  const updateDroppableIsEnabled = (id: DroppableId, isEnabled: boolean) => {
    if (!state.droppables[id]) {
      console.error(`Cannot update the scroll on Droppable ${id} as it is not registered`);
      return;
    }
    // no need to update the application state if a collection is not occurring
    if (!state.isCollecting) {
      return;
    }
    callbacks.updateDroppableIsEnabled(id, isEnabled);
  };

  const updateDroppableScroll = (id: DroppableId, newScroll: Position) => {
    if (!state.droppables[id]) {
      console.error(`Cannot update the scroll on Droppable ${id} as it is not registered`);
      return;
    }
    // no need to update the application state if a collection is not occurring
    if (!state.isCollecting) {
      return;
    }
    callbacks.updateDroppableScroll(id, newScroll);
  };

  const unregisterDraggable = (id: DraggableId) => {
    if (!state.draggables[id]) {
      console.error(`Cannot unregister Draggable with id ${id} as it is not registered`);
      return;
    }

    const newMap: DraggableEntryMap = {
      ...state.draggables,
    };
    delete newMap[id];

    setState({
      draggables: newMap,
    });

    if (!state.isCollecting) {
      return;
    }

    console.warn('currently not supporting unmounting a Draggable during a drag');
  };

  const unregisterDroppable = (id: DroppableId) => {
    if (!state.droppables[id]) {
      console.error(`Cannot unregister Droppable with id ${id} as as it is not registered`);
      return;
    }

    // Not checking if this will leave orphan draggables as react
    // unmounts parents before it unmounts children:
    // https://twitter.com/alexandereardon/status/941514612624703488

    const newMap: DroppableEntryMap = {
      ...state.droppables,
    };
    delete newMap[id];

    setState({
      droppables: newMap,
    });

    if (!state.isCollecting) {
      return;
    }

    console.warn('currently not supporting unmounting a Droppable during a drag');
  };

  const getToBeCollected = (): UnknownDescriptorType[] => {
    const draggables: DraggableEntryMap = state.draggables;
    const droppables: DroppableEntryMap = state.droppables;
    const request: ?DraggableId = state.request;

    if (!request) {
      console.error('cannot find request in state');
      return [];
    }

    const descriptor: DraggableDescriptor = draggables[request].descriptor;
    const home: DroppableDescriptor = droppables[descriptor.droppableId].descriptor;

    const draggablesToBeCollected: DraggableDescriptor[] =
      Object.keys(draggables)
        .map((id: DraggableId): DraggableDescriptor => draggables[id].descriptor)
        // remove the original draggable from the list
        .filter((item: DraggableDescriptor): boolean => item.id !== descriptor.id)
        // remove draggables that do not have the same droppable type
        .filter((item: DraggableDescriptor): boolean => {
          const entry: ?DroppableEntry = droppables[item.droppableId];

          // This should never happen
          // but it is better to print this information and continue on
          if (!entry) {
            console.warn(`Orphan Draggable found ${item.id} which says it belongs to unknown Droppable ${item.droppableId}`);
            return false;
          }

          return entry.descriptor.type === home.type;
        });

    const droppablesToBeCollected: DroppableDescriptor[] =
      Object.keys(droppables)
        .map((id: DroppableId): DroppableDescriptor => droppables[id].descriptor)
        // remove the home droppable from the list
        .filter((item: DroppableDescriptor): boolean => item.id !== home.id)
        // remove droppables with a different type
        .filter((item: DroppableDescriptor): boolean => {
          const droppable: DroppableDescriptor = droppables[item.id].descriptor;
          return droppable.type === home.type;
        });

    const toBeCollected: UnknownDescriptorType[] = [
      ...droppablesToBeCollected,
      ...draggablesToBeCollected,
    ];

    return toBeCollected;
  };

  const processPrimaryDimensions = (request: ?DraggableId) => {
    if (state.isCollecting) {
      cancel('Cannot start capturing dimensions for a drag it is already dragging');
      return;
    }

    if (!request) {
      cancel('Cannot start capturing dimensions with an invalid request', request);
      return;
    }

    setState({
      isCollecting: true,
      request,
    });

    const draggables: DraggableEntryMap = state.draggables;
    const droppables: DroppableEntryMap = state.droppables;
    const draggableEntry: ?DraggableEntry = draggables[request];

    if (!draggableEntry) {
      cancel(`Cannot find Draggable with id ${request} to start collecting dimensions`);
      return;
    }

    const homeEntry: ?DroppableEntry = droppables[draggableEntry.descriptor.droppableId];

    if (!homeEntry) {
      cancel(`Cannot find home Droppable [id:${draggableEntry.descriptor.droppableId}] for Draggable [id:${request}]`);
      return;
    }

    // Get the minimum dimensions to start a drag
    const home: DroppableDimension = homeEntry.callbacks.getDimension();
    const draggable: DraggableDimension = draggableEntry.getDimension();
    // Publishing dimensions
    callbacks.publishDroppables([home]);
    callbacks.publishDraggables([draggable]);
    // Watching the scroll of the home droppable
    homeEntry.callbacks.watchScroll();
  };

  const setFrameId = (frameId: ?number) => {
    setState({
      frameId,
    });
  };

  const processSecondaryDimensions = (): void => {
    if (!state.isCollecting) {
      cancel('Cannot collect secondary dimensions when collection is not occurring');
      return;
    }

    const toBeCollected: UnknownDescriptorType[] = getToBeCollected();

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

        // TODO: add test for this
        if (toBePublished.droppables.length) {
          callbacks.publishDroppables(toBePublished.droppables);
        }
        if (toBePublished.draggables.length) {
          callbacks.publishDraggables(toBePublished.draggables);
        }

        // need to watch the scroll on each droppable
        toBePublished.droppables.forEach((dimension: DroppableDimension) => {
          const entry: DroppableEntry = state.droppables[dimension.descriptor.id];
          entry.callbacks.watchScroll();
        });

        setFrameId(null);
      });

      setFrameId(publishFrameId);
    });

    setFrameId(collectFrameId);
  };

  const stopCollecting = () => {
    // Tell all droppables to stop watching scroll
    // all good if they where not already listening
    Object.keys(state.droppables)
      .forEach((id: DroppableId) => state.droppables[id].callbacks.unwatchScroll());

    if (state.frameId) {
      cancelAnimationFrame(state.frameId);
    }

    // reset collections state
    setState({
      isCollecting: false,
      request: null,
      frameId: null,
    });
  };

  const onPhaseChange = (current: AppState) => {
    const phase: Phase = current.phase;

    if (phase === 'COLLECTING_INITIAL_DIMENSIONS') {
      processPrimaryDimensions(current.dimension.request);
      return;
    }

    if (phase === 'DRAGGING') {
      if (current.dimension.request !== state.request) {
        cancel('Request in local state does not match that of the store');
        return;
      }

      processSecondaryDimensions();
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
    unregisterDraggable,
    registerDroppable,
    unregisterDroppable,
    updateDroppableIsEnabled,
    updateDroppableScroll,
    onPhaseChange,
  };

  return marshal;
};
