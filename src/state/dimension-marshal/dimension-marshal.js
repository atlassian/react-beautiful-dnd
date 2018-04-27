// @flow
import { type Position } from 'css-box-model';
import type {
  DraggableId,
  DroppableId,
  TypeId,
  DroppableDescriptor,
  DraggableDescriptor,
  DraggableDimension,
  DroppableDimension,
  State as AppState,
  Phase,
  LiftRequest,
  ScrollOptions,
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
  // short lived
  isCollecting: boolean,
  scrollOptions: ?ScrollOptions,
  request: ?LiftRequest,
  requestType: ?TypeId,
  frameId: ?AnimationFrameID,
|}

type ToBePublished = {|
  droppables: DroppableDimension[],
  draggables: DraggableDimension[],
|}

export default (callbacks: Callbacks) => {
  let state: State = {
    droppables: {},
    draggables: {},
    isCollecting: false,
    scrollOptions: null,
    request: null,
    requestType: null,
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

    // We want to cancel the drag even if we are not collecting yet
    // This is true when trying to lift something that has not been published
    callbacks.cancel();

    if (!state.isCollecting) {
      return;
    }

    // eslint-disable-next-line no-use-before-define
    stopCollecting();
  };

  const cancelIfModifyingActiveDraggable = (descriptor: DraggableDescriptor) => {
    if (!state.isCollecting) {
      return;
    }

    const home: ?DroppableEntry = state.droppables[descriptor.droppableId];

    // In React 16 children are mounted before parents are.
    // This case can happen when a list of Draggables are being
    // moved using a React.Portal.
    if (!home) {
      return;
    }

    // Adding something of a different type - not relevant to the drag
    if (home.descriptor.type !== state.requestType) {
      return;
    }

    // Technically we could let the drag go on - but this is being more explicit
    // with consumers to prevent undesirable states
    cancel('Adding or removing a Draggable during a drag is currently not supported');
  };

  const cancelIfModifyingActiveDroppable = (descriptor: DroppableDescriptor) => {
    if (!state.isCollecting) {
      return;
    }

    // Adding something of a different type - not relevant to the drag
    // This can happen when dragging a Draggable that has a child Droppable
    // when using a React.Portal as the child Droppable component will be remounted
    if (descriptor.type !== state.requestType) {
      return;
    }

    cancel('Adding or removing a Droppable during a drag is currently not supported');
  };

  const registerDraggable = (
    descriptor: DraggableDescriptor,
    getDimension: GetDraggableDimensionFn
  ) => {
    const id: DraggableId = descriptor.id;

    // Not checking if the draggable already exists.
    // - This allows for overwriting in particular circumstances.
    // Not checking if a parent droppable exists.
    // - In React 16 children are mounted before their parents

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

    cancelIfModifyingActiveDraggable(descriptor);
  };

  const registerDroppable = (
    descriptor: DroppableDescriptor,
    droppableCallbacks: DroppableCallbacks,
  ) => {
    const id: DroppableId = descriptor.id;

    // Not checking if there is already a droppable published with the same id
    // In some situations a Droppable might be published with the same id as
    // a Droppable that is about to be unmounted - but has not unpublished yet

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

    cancelIfModifyingActiveDroppable(descriptor);
  };

  const updateDroppableIsEnabled = (id: DroppableId, isEnabled: boolean) => {
    if (!state.droppables[id]) {
      cancel(`Cannot update the scroll on Droppable ${id} as it is not registered`);
      return;
    }
    // no need to update the application state if a collection is not occurring
    if (!state.isCollecting) {
      return;
    }
    // At this point a non primary droppable dimension might not yet be published
    // but may have its enabled state changed. For now we still publish this change
    // and let the reducer exit early if it cannot find the dimension in the state.
    callbacks.updateDroppableIsEnabled(id, isEnabled);
  };

  const updateDroppableScroll = (id: DroppableId, newScroll: Position) => {
    if (!state.droppables[id]) {
      cancel(`Cannot update the scroll on Droppable ${id} as it is not registered`);
      return;
    }
    // no need to update the application state if a collection is not occurring
    if (!state.isCollecting) {
      return;
    }
    callbacks.updateDroppableScroll(id, newScroll);
  };

  const scrollDroppable = (id: DroppableId, change: Position) => {
    const entry: ?DroppableEntry = state.droppables[id];
    if (!entry) {
      return;
    }

    if (!state.isCollecting) {
      return;
    }

    entry.callbacks.scroll(change);
  };

  const unregisterDraggable = (descriptor: DraggableDescriptor) => {
    const entry: ?DraggableEntry = state.draggables[descriptor.id];

    if (!entry) {
      cancel(`Cannot unregister Draggable with id ${descriptor.id} as it is not registered`);
      return;
    }

    // Entry has already been overwritten.
    // This can happen when a new Draggable with the same draggableId
    // is mounted before the old Draggable has been removed.
    if (entry.descriptor !== descriptor) {
      return;
    }

    const newMap: DraggableEntryMap = {
      ...state.draggables,
    };
    delete newMap[descriptor.id];

    setState({
      draggables: newMap,
    });

    cancelIfModifyingActiveDraggable(descriptor);
  };

  const unregisterDroppable = (descriptor: DroppableDescriptor) => {
    const entry: ?DroppableEntry = state.droppables[descriptor.id];

    if (!entry) {
      cancel(`Cannot unregister Droppable with id ${descriptor.id} as as it is not registered`);
      return;
    }

    // entry has already been overwritten
    // in which can we will not remove it
    if (entry.descriptor !== descriptor) {
      return;
    }

    // Not checking if this will leave orphan draggables as react
    // unmounts parents before it unmounts children:
    // https://twitter.com/alexandereardon/status/941514612624703488

    const newMap: DroppableEntryMap = {
      ...state.droppables,
    };
    delete newMap[descriptor.id];

    setState({
      droppables: newMap,
    });

    cancelIfModifyingActiveDroppable(descriptor);
  };

  const getToBeCollected = (): UnknownDescriptorType[] => {
    const draggables: DraggableEntryMap = state.draggables;
    const droppables: DroppableEntryMap = state.droppables;
    const request: ?LiftRequest = state.request;

    if (!request) {
      console.error('cannot find request in state');
      return [];
    }
    const draggableId: DraggableId = request.draggableId;
    const descriptor: DraggableDescriptor = draggables[draggableId].descriptor;
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

  const processPrimaryDimensions = (request: ?LiftRequest) => {
    if (state.isCollecting) {
      cancel('Cannot start capturing dimensions for a drag it is already dragging');
      return;
    }

    if (!request) {
      cancel('Cannot start capturing dimensions with an invalid request', request);
      return;
    }

    const draggables: DraggableEntryMap = state.draggables;
    const droppables: DroppableEntryMap = state.droppables;
    const draggableId: DraggableId = request.draggableId;
    const draggableEntry: ?DraggableEntry = draggables[draggableId];

    if (!draggableEntry) {
      cancel(`Cannot find Draggable with id ${draggableId} to start collecting dimensions`);
      return;
    }

    const homeEntry: ?DroppableEntry = droppables[draggableEntry.descriptor.droppableId];

    if (!homeEntry) {
      cancel(`
        Cannot find home Droppable [id:${draggableEntry.descriptor.droppableId}]
        for Draggable [id:${request.draggableId}]
      `);
      return;
    }

    setState({
      isCollecting: true,
      request,
      requestType: homeEntry.descriptor.type,
    });

    // Get the minimum dimensions to start a drag
    const home: DroppableDimension = homeEntry.callbacks.getDimension();
    const draggable: DraggableDimension = draggableEntry.getDimension();
    // Publishing dimensions
    callbacks.publishDroppable(home);
    callbacks.publishDraggable(draggable);
    // Watching the scroll of the home droppable
    homeEntry.callbacks.watchScroll(request.scrollOptions);
  };

  const setFrameId = (frameId: ?AnimationFrameID) => {
    setState({
      frameId,
    });
  };

  const processSecondaryDimensions = (requestInAppState: ?LiftRequest): void => {
    if (!state.isCollecting) {
      cancel('Cannot collect secondary dimensions when collection is not occurring');
      return;
    }

    const request: ?LiftRequest = state.request;

    if (!request) {
      cancel('Cannot process secondary dimensions without a request');
      return;
    }

    if (!requestInAppState) {
      cancel('Cannot process secondary dimensions without a request on the state');
      return;
    }

    if (requestInAppState.draggableId !== request.draggableId) {
      cancel('Cannot process secondary dimensions as local request does not match app state');
      return;
    }

    const toBeCollected: UnknownDescriptorType[] = getToBeCollected();

    // Phase 1: collect dimensions in a single frame
    const collectFrameId: AnimationFrameID = requestAnimationFrame(() => {
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
      const publishFrameId: AnimationFrameID = requestAnimationFrame(() => {
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

        callbacks.bulkPublish(
          toBePublished.droppables,
          toBePublished.draggables,
        );

        // need to watch the scroll on each droppable
        toBePublished.droppables.forEach((dimension: DroppableDimension) => {
          const entry: DroppableEntry = state.droppables[dimension.descriptor.id];
          entry.callbacks.watchScroll(request.scrollOptions);
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
      processSecondaryDimensions(current.dimension.request);
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
    scrollDroppable,
    updateDroppableScroll,
    onPhaseChange,
  };

  return marshal;
};
