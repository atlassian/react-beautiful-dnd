// @flow
import { type Position } from 'css-box-model';
import invariant from 'tiny-invariant';
import createCollector, { type Collector } from './collector';
import type {
  DraggableId,
  DroppableId,
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
  ToBeCollected,
  DroppableEntry,
  DraggableEntry,
  DroppableEntryMap,
  DraggableEntryMap,
} from './dimension-marshal-types';

type Collection = {|
  scrollOptions: ScrollOptions,
  critical: {|
    draggable: DraggableDescriptor,
    droppable: DroppableDescriptor,
  |}
|}

type Entries = {|
  droppables: DroppableEntryMap,
  draggables: DraggableEntryMap,
|}

export default (callbacks: Callbacks) => {
  const entries: Entries = {
    droppables: {},
    draggables: {},
  };
  let collection: ?Collection = null;

  const getToBeCollected = (): ToBeCollected => {
    invariant(collection, 'Cannot collect dimensions when no collection is occurring');

    const home: DroppableDescriptor = collection.critical.droppable;

    const draggables: DraggableId[] =
      Object.keys(entries.draggables)
        // remove draggables that do not have the same droppable type
        .filter((id: DraggableId): boolean => {
          const entry: DraggableEntry = entries.draggables[id];
          const parent: ?DroppableEntry = entries.droppables[entry.descriptor.droppableId];

          // This should never happen
          // but it is better to print this information and continue on
          if (!parent) {
            console.warn(`
              Orphan Draggable found [id: ${entry.descriptor.id}] which says
              it belongs to unknown Droppable ${entry.descriptor.droppableId}
            `);
            return false;
          }

          return parent.descriptor.type === home.type;
        });

    const droppables: DroppableId[] =
      Object.keys(entries.droppables)
        // remove droppables with a different type
        .filter((id: DroppableId): boolean => entries.droppables[id].descriptor.type === home.type);

    return {
      draggables,
      droppables,
    };
  };

  const collector: Collector = createCollector({
    publish: callbacks.bulkPublish,
    getDraggable: (id: DraggableId): DraggableDimension => {
      const entry: ?DraggableEntry = entries.draggables[id];
      invariant(entry);

      return entry.getDimension();
    },
    getDroppable: (id: DroppableId): DroppableDimension => {
      const entry: ?DroppableEntry = entries.droppables[id];
      invariant(entry);

      return entry.callbacks.getDimension();
    },
    getToBeCollected,
  });

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
    entries.draggables[id] = entry;

    if (!collection) {
      return;
    }

    const home: ?DroppableEntry = entries.droppables[descriptor.droppableId];

    // In React 16 children are mounted before parents are.
    // This case can happen when a list of Draggables are being
    // moved using a React.Portal.
    if (!home) {
      return;
    }

    // Adding something of a different type - not relevant to the drag
    if (home.descriptor.type !== collection.critical.droppable.type) {
      return;
    }

    collector.collect();
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

    entries.droppables[id] = entry;

    if (!collection) {
      return;
    }

    // Not of the same type - we do not need to publish
    if (descriptor.type !== collection.critical.droppable.type) {
      return;
    }

    collector.collect();
  };

  const updateDroppableIsEnabled = (id: DroppableId, isEnabled: boolean) => {
    // no need to update the application state if a collection is not occurring
    if (!collection) {
      return;
    }

    invariant(entries.droppables[id], `Cannot update the scroll on Droppable ${id} as it is not registered`);

    // At this point a non primary droppable dimension might not yet be published
    // but may have its enabled state changed. For now we still publish this change
    // and let the reducer exit early if it cannot find the dimension in the state.
    callbacks.updateDroppableIsEnabled(id, isEnabled);
  };

  const updateDroppableScroll = (id: DroppableId, newScroll: Position) => {
    invariant(entries.droppables[id], `Cannot update the scroll on Droppable ${id} as it is not registered`);

    // no need to update the application state if a collection is not occurring
    if (!collecting) {
      return;
    }
    callbacks.updateDroppableScroll(id, newScroll);
  };

  const scrollDroppable = (id: DroppableId, change: Position) => {
    const entry: ?DroppableEntry = entries.droppables[id];

    invariant(entry, 'Cannot scroll Droppable if not in entries');

    if (!collection) {
      return;
    }

    entry.callbacks.scroll(change);
  };

  const unregisterDraggable = (descriptor: DraggableDescriptor) => {
    const entry: ?DraggableEntry = entries.draggables[descriptor.id];

    invariant(entry, `Cannot unregister Draggable with id ${descriptor.id} as it is not registered`);

    // Entry has already been overwritten.
    // This can happen when a new Draggable with the same draggableId
    // is mounted before the old Draggable has been removed.
    if (entry.descriptor !== descriptor) {
      return;
    }

    delete entries.draggables[descriptor.id];

    if (!collection) {
      return;
    }

    console.warn('TODO: batch unpublish draggable');
  };

  const unregisterDroppable = (descriptor: DroppableDescriptor) => {
    const entry: ?DroppableEntry = entries.droppables[descriptor.id];

    invariant(entry, `Cannot unregister Droppable with id ${descriptor.id} as as it is not registered`);

    // entry has already been overwritten
    // in which can we will not remove it
    if (entry.descriptor !== descriptor) {
      return;
    }

    // Not checking if this will leave orphan draggables as react
    // unmounts parents before it unmounts children:
    // https://twitter.com/alexandereardon/status/941514612624703488

    delete entries.droppables[descriptor.id];

    if (!collection) {
      return;
    }

    console.warn('TODO: publish droppable unpublish');
  };

  const collectCriticalDimensions = (request: ?LiftRequest) => {
    invariant(collection, 'Cannot start capturing dimensions for a drag it is already dragging');
    invariant(request, 'Cannot start capturing dimensions with an invalid request', request);

    const draggables: DraggableEntryMap = entries.draggables;
    const droppables: DroppableEntryMap = entries.droppables;
    const draggableId: DraggableId = request.draggableId;
    const draggableEntry: ?DraggableEntry = draggables[draggableId];

    invariant(draggableEntry, `Cannot find Draggable with id ${draggableId} to start collecting dimensions`);

    const homeEntry: ?DroppableEntry = droppables[draggableEntry.descriptor.droppableId];

    invariant(homeEntry, `
      Cannot find home Droppable [id:${draggableEntry.descriptor.droppableId}]
      for Draggable [id:${request.draggableId}]
    `);

    collection = {
      scrollOptions: request.scrollOptions,
      critical: {
        draggable: draggableEntry.descriptor,
        droppable: homeEntry.descriptor,
      },
    };

    // Get the minimum dimensions to start a drag
    const home: DroppableDimension = homeEntry.callbacks.getDimension();
    const draggable: DraggableDimension = draggableEntry.getDimension();
    callbacks.publishDroppable(home);
    callbacks.publishDraggable(draggable);
  };

  const stopCollecting = () => {
    invariant(collection, 'Cannot stop collecting when there is no collection');

    // Tell all droppables to stop watching scroll
    // all good if they where not already listening
    Object.keys(entries.droppables)
      .forEach((id: DroppableId) => entries.droppables[id].callbacks.unwatchScroll());

    collection = null;
    collector.stop();
  };

  const onPhaseChange = (current: AppState) => {
    const phase: Phase = current.phase;

    if (phase === 'COLLECTING_INITIAL_DIMENSIONS') {
      collectCriticalDimensions(current.dimension.request);
      return;
    }

    if (phase === 'DRAGGING') {
      invariant(collection, 'Cannot start a drag without a collection');

      // Sanity checking that our recorded collection matches the request in app state
      const request: ?LiftRequest = current.dimension.request;
      invariant(request);
      invariant(request.draggableId === collection.critical.draggable.id,
        'Recorded request does not match app state'
      );
      invariant(request.scrollOptions === collection.scrollOptions,
        'Recorded scroll options does not match app state'
      );

      collector.start(collection);
      return;
    }

    if (collection) {
      stopCollecting();
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
