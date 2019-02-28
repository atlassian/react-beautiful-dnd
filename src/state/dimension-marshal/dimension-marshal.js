// @flow
import { type Position } from 'css-box-model';
import invariant from 'tiny-invariant';
import createPublisher, {
  type WhileDraggingPublisher,
} from './while-dragging-publisher';
import getInitialPublish from './get-initial-publish';
import type {
  DroppableId,
  DroppableDescriptor,
  DraggableDescriptor,
  LiftRequest,
  Critical,
} from '../../types';
import { values } from '../../native-with-fallback';
import type {
  DimensionMarshal,
  Callbacks,
  GetDraggableDimensionFn,
  DroppableCallbacks,
  Entries,
  DroppableEntry,
  DraggableEntry,
  StartPublishingResult,
} from './dimension-marshal-types';

type Collection = {|
  critical: Critical,
|};

const throwIfAddOrRemoveOfWrongType = (
  collection: Collection,
  descriptor: DraggableDescriptor,
) => {
  invariant(
    collection.critical.draggable.type === descriptor.type,
    `We have detected that you have added a Draggable during a drag.
      This is not of the same type as the dragging item

      Dragging type: ${collection.critical.draggable.type}.
      Added type: ${descriptor.type}

      We are not allowing this as you can run into problems if your change
      has shifted the positioning of other Droppables, or has changed the size of the page`,
  );
};

export default (callbacks: Callbacks) => {
  const entries: Entries = {
    droppables: {},
    draggables: {},
  };
  let collection: ?Collection = null;

  const publisher: WhileDraggingPublisher = createPublisher({
    callbacks: {
      publish: callbacks.publishWhileDragging,
      collectionStarting: callbacks.collectionStarting,
    },
    getEntries: (): Entries => entries,
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

    throwIfAddOrRemoveOfWrongType(collection, descriptor);

    // A Draggable has been added during a collection - need to act!
    publisher.add(descriptor);
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

    // it is fine if these are updated during a drag
    // this can happen as the index changes
  };

  const unregisterDraggable = (descriptor: DraggableDescriptor) => {
    const entry: ?DraggableEntry = entries.draggables[descriptor.id];
    invariant(
      entry,
      `Cannot unregister Draggable with id:
      ${descriptor.id} as it is not registered`,
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

    throwIfAddOrRemoveOfWrongType(collection, descriptor);

    publisher.remove(descriptor);
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

    invariant(!collection, 'Cannot add a Droppable during a drag');
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

    invariant(
      !collection,
      'You are not able to update the id or type of a droppable during a drag',
    );
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

    invariant(!collection, 'Cannot add a Droppable during a drag');
  };

  const updateDroppableIsEnabled = (id: DroppableId, isEnabled: boolean) => {
    invariant(
      entries.droppables[id],
      `Cannot update is enabled flag of Droppable ${id} as it is not registered`,
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

  const updateDroppableIsCombineEnabled = (
    id: DroppableId,
    isCombineEnabled: boolean,
  ) => {
    invariant(
      entries.droppables[id],
      `Cannot update isCombineEnabled flag of Droppable ${id} as it is not registered`,
    );

    // no need to update
    if (!collection) {
      return;
    }

    callbacks.updateDroppableIsCombineEnabled({ id, isCombineEnabled });
  };

  const updateDroppableIsSortDisabled = (
    id: DroppableId,
    isSortDisabled: boolean,
  ) => {
    invariant(
      entries.droppables[id],
      `Cannot update isSortDisabled flag of Droppable ${id} as it is not registered`,
    );

    // no need to update
    if (!collection) {
      return;
    }

    callbacks.updateDroppableIsSortDisabled({ id, isSortDisabled });
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
    values(entries.droppables)
      .filter(
        (entry: DroppableEntry): boolean => entry.descriptor.type === home.type,
      )
      .forEach((entry: DroppableEntry) => entry.callbacks.dragStopped());

    // Finally - clear our collection
    collection = null;
  };

  const startPublishing = (request: LiftRequest): StartPublishingResult => {
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
      critical,
    };

    return getInitialPublish({
      critical,
      entries,
      scrollOptions: request.scrollOptions,
    });
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
    updateDroppableIsCombineEnabled,
    updateDroppableIsSortDisabled,
    scrollDroppable,
    updateDroppableScroll,

    // Entry
    startPublishing,
    stopPublishing,
  };

  return marshal;
};
