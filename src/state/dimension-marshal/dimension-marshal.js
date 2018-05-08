// @flow
import { type Position } from 'css-box-model';
import invariant from 'tiny-invariant';
import createCollector, { type Collector } from './collector';
// TODO: state folder reaching into view
import * as timings from '../../debug/timings';
import type {
  DraggableId,
  DroppableId,
  DroppableDescriptor,
  DraggableDescriptor,
  DimensionMap,
  LiftRequest,
  Critical,
} from '../../types';
import type {
  DimensionMarshal,
  Callbacks,
  GetDraggableDimensionFn,
  DroppableCallbacks,
  Entries,
  DroppableEntry,
  DraggableEntry,
  Collection,
} from './dimension-marshal-types';

export default (callbacks: Callbacks) => {
  const entries: Entries = {
    droppables: {},
    draggables: {},
  };
  let collection: ?Collection = null;

  const collector: Collector = createCollector({
    bulkReplace: callbacks.bulkReplace,
    getEntries: () => entries,
  });

  const collect = ({ includeCritical }: {| includeCritical: boolean |}) => {
    invariant(collection, 'Cannot collect without a collection occurring');
    collector.collect({
      collection,
      includeCritical,
    });
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

    invariant(descriptor.id !== collection.critical.draggable.id, 'Cannot unregister dragging item during a drag');

    collect({ includeCritical: false });
  };

  const updateDraggable = (
    previous: DraggableDescriptor,
    descriptor: DraggableDescriptor,
    getDimension: GetDraggableDimensionFn,
  ) => {
    invariant(entries.draggables[previous.id], 'Cannot update draggable registration as no previous registration was found');

    if (!collection) {
      delete entries.draggables[previous.id];
      registerDraggable(descriptor, getDimension);
      return;
    }

    // A collection is occurring
    invariant(descriptor.id === previous.id, 'Cannot update a Draggables id during a drag');
    invariant(descriptor.droppableId === previous.droppableId, 'Cannot update a Draggables droppable during a drag');

    const home: ?DroppableEntry = entries.droppables[descriptor.droppableId];
    invariant(home, 'Cannot update a Draggable that does not have a home');

    collect({ includeCritical: false });
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

    invariant(descriptor.id !== collection.critical.draggable.id, 'Cannot unregister dragging item during a drag');

    collect({ includeCritical: false });
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

    invariant(descriptor.id !== collection.critical.droppable.id, 'Cannot register home droppable during a drag');

    collect({ includeCritical: false });
  };

  const updateDroppable = (
    previous: DroppableDescriptor,
    descriptor: DroppableDescriptor,
    droppableCallbacks: DroppableCallbacks,
  ) => {
    invariant(entries.droppables[previous.id], 'Cannot update droppable registration as no previous registration was found');

    if (collection) {
      invariant(descriptor.id === previous.id, 'Cannot update a Droppables id during a drag');
      invariant(descriptor.type === previous.type, 'Cannot update a Droppables type during a drag');
    }

    delete entries.droppables[previous.id];

    registerDroppable(descriptor, droppableCallbacks);

    collect({ includeCritical: false });
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

    invariant(descriptor.id !== collection.critical.droppable.id, 'Cannot unregister home droppable during a drag');

    collect({ includeCritical: false });
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
    if (!collection) {
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

  const getCritical = (windowScroll: Position): DimensionMap => {
    invariant(collection, 'Cannot get critical dimensions without a collection');
    timings.start('initial collection and publish');

    const draggable: DraggableDescriptor = collection.critical.draggable;
    const droppable: DroppableDescriptor = collection.critical.droppable;

    const map: DimensionMap = {
      draggables: {
        [draggable.id]: entries.draggables[draggable.id]
          .getDimension(windowScroll),
      },
      droppables: {
        [droppable.id]: entries.droppables[droppable.id]
          .callbacks.getDimensionAndWatchScroll(windowScroll, collection.scrollOptions),
      },
    };

    timings.finish('initial collection and publish');
    return map;
  };

  const stopCollecting = () => {
    invariant(collection, 'Cannot stop collecting when there is no collection');
    const home: DroppableDescriptor = collection.critical.droppable;
    // Tell all droppables to stop watching scroll
    // all good if they where not already listening
    Object.keys(entries.droppables)
      .filter((id: DroppableId): boolean => entries.droppables[id].descriptor.type === home.type)
      .forEach((id: DroppableId) => entries.droppables[id].callbacks.unwatchScroll());

    collection = null;
    collector.stop();
  };

  const startPublishing = (request: LiftRequest, windowScroll: Position) => {
    invariant(!collection, 'Cannot start capturing critical dimensions as there is already a collection');
    const entry: ?DraggableEntry = entries.draggables[request.draggableId];
    invariant(entry, 'Cannot find critical draggable entry');
    const home: ?DroppableEntry = entries.droppables[entry.descriptor.droppableId];
    invariant(home, 'Cannot find critical droppable entry');

    const critical: Critical = {
      draggable: entry.descriptor,
      droppable: home.descriptor,
    };

    collection = {
      scrollOptions: request.scrollOptions,
      critical,
    };

    const dimensions: DimensionMap = getCritical(windowScroll);

    return {
      dimensions,
      critical,
    };
  };

  const marshal: DimensionMarshal = {

    registerDraggable,
    updateDraggable,
    unregisterDraggable,
    registerDroppable,
    updateDroppable,
    unregisterDroppable,
    updateDroppableIsEnabled,
    scrollDroppable,
    updateDroppableScroll,
    // onPhaseChange,

    // Entry
    startPublishing,
    collect,
    stopPublishing: stopCollecting,
  };

  return marshal;
};
