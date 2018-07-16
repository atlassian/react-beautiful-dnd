// @flow
import { type Position } from 'css-box-model';
import invariant from 'tiny-invariant';
import createPublisher, { type Publisher, type Provided } from './publisher';
// TODO: state folder reaching into view
import * as timings from '../../debug/timings';
import type {
  DraggableId,
  DroppableId,
  DroppableDescriptor,
  DroppableDimension,
  DraggableDimension,
  DraggableDescriptor,
  DraggableDimensionMap,
  DroppableDimensionMap,
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
  StartPublishingResult,
  Collection,
} from './dimension-marshal-types';

export default (callbacks: Callbacks) => {
  const entries: Entries = {
    droppables: {},
    draggables: {},
  };
  let collection: ?Collection = null;

  const publisher: Publisher = createPublisher({
    callbacks: {
      publish: callbacks.publish,
      collectionStarting: callbacks.collectionStarting,
    },
    getProvided: (): Provided => {
      invariant(
        collection,
        'Cannot get scroll options when there is no collection',
      );
      return {
        entries,
        collection,
      };
    },
  });

  const registerDraggable = (
    descriptor: DraggableDescriptor,
    getDimension: GetDraggableDimensionFn,
  ) => {
    // Not checking if the draggable already exists.
    // - This allows for overwriting in particular circumstances.
    // Not checking if a parent droppable exists.
    // - In React 16 children are mounted before their parents

    const entry: DraggableEntry = {
      descriptor,
      getDimension,
    };
    entries.draggables[descriptor.id] = entry;

    if (!collection) {
      return;
    }

    // Not relevant to the drag
    if (collection.critical.draggable.type !== descriptor.type) {
      return;
    }

    // A Draggable has been added during a collection - need to act!
    publisher.addDraggable(descriptor.id);
  };

  const updateDraggable = (
    previous: DraggableDescriptor,
    descriptor: DraggableDescriptor,
    getDimension: GetDraggableDimensionFn,
  ) => {
    invariant(
      entries.draggables[previous.id],
      'Cannot update draggable registration as no previous registration was found',
    );

    // id might have changed so we are removing the old entry
    delete entries.draggables[previous.id];
    // adding new entry
    const entry: DraggableEntry = {
      descriptor,
      getDimension,
    };
    entries.draggables[descriptor.id] = entry;
  };

  const unregisterDraggable = (descriptor: DraggableDescriptor) => {
    const entry: ?DraggableEntry = entries.draggables[descriptor.id];
    invariant(
      entry,
      `Cannot unregister Draggable with id ${
        descriptor.id
      } as it is not registered`,
    );

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

    invariant(
      collection.critical.draggable.id !== descriptor.id,
      'Cannot remove the dragging item during a drag',
    );

    // Not relevant to the drag
    if (descriptor.type !== collection.critical.draggable.type) {
      return;
    }

    publisher.removeDraggable(descriptor.id);
  };

  const registerDroppable = (
    descriptor: DroppableDescriptor,
    droppableCallbacks: DroppableCallbacks,
  ) => {
    const id: DroppableId = descriptor.id;

    // Not checking if there is already a droppable published with the same id
    // In some situations a Droppable might be published with the same id as
    // a Droppable that is about to be unmounted - but has not unpublished yet

    entries.droppables[id] = {
      descriptor,
      callbacks: droppableCallbacks,
    };

    if (!collection) {
      return;
    }

    // Not relevant to this drag
    if (descriptor.type !== collection.critical.droppable.type) {
      return;
    }

    publisher.addDroppable(id);
  };

  const updateDroppable = (
    previous: DroppableDescriptor,
    descriptor: DroppableDescriptor,
    droppableCallbacks: DroppableCallbacks,
  ) => {
    invariant(
      entries.droppables[previous.id],
      'Cannot update droppable registration as no previous registration was found',
    );

    // The id might have changed, so we are removing the old entry
    delete entries.droppables[previous.id];

    const entry: DroppableEntry = {
      descriptor,
      callbacks: droppableCallbacks,
    };
    entries.droppables[descriptor.id] = entry;

    if (collection) {
      invariant(
        false,
        'You are not able to update the id or type of a droppable during a drag',
      );
    }
  };

  const unregisterDroppable = (descriptor: DroppableDescriptor) => {
    const entry: ?DroppableEntry = entries.droppables[descriptor.id];

    invariant(
      entry,
      `Cannot unregister Droppable with id ${
        descriptor.id
      } as as it is not registered`,
    );

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

    invariant(
      collection.critical.droppable.id !== descriptor.id,
      'Cannot remove the home Droppable during a drag',
    );

    // Not relevant to the drag
    if (collection.critical.droppable.type !== descriptor.type) {
      return;
    }

    publisher.removeDroppable(descriptor.id);
  };

  const updateDroppableIsEnabled = (id: DroppableId, isEnabled: boolean) => {
    invariant(
      entries.droppables[id],
      `Cannot update the scroll on Droppable ${id} as it is not registered`,
    );

    // no need to update the application state if a collection is not occurring
    if (!collection) {
      return;
    }

    // At this point a non primary droppable dimension might not yet be published
    // but may have its enabled state changed. For now we still publish this change
    // and let the reducer exit early if it cannot find the dimension in the state.
    callbacks.updateDroppableIsEnabled({ id, isEnabled });
  };

  const updateDroppableScroll = (id: DroppableId, newScroll: Position) => {
    invariant(
      entries.droppables[id],
      `Cannot update the scroll on Droppable ${id} as it is not registered`,
    );

    // no need to update the application state if a collection is not occurring
    if (!collection) {
      return;
    }

    callbacks.updateDroppableScroll({ id, offset: newScroll });
  };

  const scrollDroppable = (id: DroppableId, change: Position) => {
    const entry: ?DroppableEntry = entries.droppables[id];

    invariant(entry, `Cannot scroll Droppable ${id} as it is not registered`);

    if (!collection) {
      return;
    }

    entry.callbacks.scroll(change);
  };

  const getInitialPublish = (
    args: Collection,
    windowScroll: Position,
  ): StartPublishingResult => {
    const { critical, scrollOptions } = args;
    const timingKey: string = 'Initial collection from DOM';
    timings.start(timingKey);

    const home: DroppableDescriptor = critical.droppable;

    const droppables: DroppableDimensionMap = Object.keys(entries.droppables)
      .map((id: DroppableId): DroppableEntry => entries.droppables[id])
      // Exclude things of the wrong type
      .filter(
        (entry: DroppableEntry): boolean => entry.descriptor.type === home.type,
      )
      .map(
        (entry: DroppableEntry): DroppableDimension =>
          entry.callbacks.getDimensionAndWatchScroll(
            windowScroll,
            scrollOptions,
          ),
      )
      .reduce(
        (previous: DroppableDimensionMap, dimension: DroppableDimension) => {
          previous[dimension.descriptor.id] = dimension;
          return previous;
        },
        {},
      );

    const draggables: DraggableDimensionMap = Object.keys(entries.draggables)
      .map((id: DraggableId): DraggableEntry => entries.draggables[id])
      .filter(
        (entry: DraggableEntry): boolean =>
          entry.descriptor.type === critical.draggable.type,
      )
      .map(
        (entry: DraggableEntry): DraggableDimension =>
          entry.getDimension(windowScroll),
      )
      .reduce(
        (previous: DraggableDimensionMap, dimension: DraggableDimension) => {
          previous[dimension.descriptor.id] = dimension;
          return previous;
        },
        {},
      );

    timings.finish(timingKey);

    const dimensions: DimensionMap = { draggables, droppables };

    const result: StartPublishingResult = {
      dimensions,
      critical,
    };

    return result;
  };

  const stopPublishing = () => {
    // This function can be called defensively
    if (!collection) {
      return;
    }
    // Stop any pending dom collections or publish
    publisher.stop();

    // Tell all droppables to stop watching scroll
    // all good if they where not already listening
    const home: DroppableDescriptor = collection.critical.droppable;
    Object.keys(entries.droppables)
      .filter(
        (id: DroppableId): boolean =>
          entries.droppables[id].descriptor.type === home.type,
      )
      .forEach((id: DroppableId) =>
        entries.droppables[id].callbacks.unwatchScroll(),
      );

    // Finally - clear our collection
    collection = null;
  };

  const startPublishing = (
    request: LiftRequest,
    windowScroll: Position,
  ): StartPublishingResult => {
    invariant(
      !collection,
      'Cannot start capturing critical dimensions as there is already a collection',
    );
    const entry: ?DraggableEntry = entries.draggables[request.draggableId];
    invariant(entry, 'Cannot find critical draggable entry');
    const home: ?DroppableEntry =
      entries.droppables[entry.descriptor.droppableId];
    invariant(home, 'Cannot find critical droppable entry');

    const critical: Critical = {
      draggable: entry.descriptor,
      droppable: home.descriptor,
    };

    collection = {
      scrollOptions: request.scrollOptions,
      critical,
    };

    return getInitialPublish(collection, windowScroll);
  };

  const marshal: DimensionMarshal = {
    // dimension registration
    registerDraggable,
    updateDraggable,
    unregisterDraggable,
    registerDroppable,
    updateDroppable,
    unregisterDroppable,

    // droppable changes
    updateDroppableIsEnabled,
    scrollDroppable,
    updateDroppableScroll,

    // Entry
    startPublishing,
    stopPublishing,
  };

  return marshal;
};
