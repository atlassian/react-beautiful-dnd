// @flow
import { type Position } from 'css-box-model';
import invariant from 'tiny-invariant';
import type {
  DimensionMarshal,
  Callbacks,
  StartPublishingResult,
} from './dimension-marshal-types';
import createPublisher, {
  type WhileDraggingPublisher,
} from './while-dragging-publisher';
import getInitialPublish from './get-initial-publish';
import type {
  Registry,
  DroppableEntry,
  DraggableEntry,
  Subscriber,
  Unsubscribe,
  RegistryEvent,
} from '../registry/registry-types';
import type {
  DroppableId,
  DroppableDescriptor,
  LiftRequest,
  Critical,
  DraggableId,
} from '../../types';

type Collection = {|
  critical: Critical,
  unsubscribe: Unsubscribe,
|};

export default (registry: Registry, callbacks: Callbacks) => {
  let collection: ?Collection = null;

  const publisher: WhileDraggingPublisher = createPublisher({
    callbacks: {
      publish: callbacks.publishWhileDragging,
      collectionStarting: callbacks.collectionStarting,
      getCritical: (): Critical => {
        invariant(
          collection,
          'Cannot get critical when there is no collection',
        );
        return collection.critical;
      },
    },
    registry,
  });

  const updateDroppableIsEnabled = (id: DroppableId, isEnabled: boolean) => {
    invariant(
      registry.droppable.exists(id),
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
    // no need to update
    if (!collection) {
      return;
    }

    invariant(
      registry.droppable.exists(id),
      `Cannot update isCombineEnabled flag of Droppable ${id} as it is not registered`,
    );

    callbacks.updateDroppableIsCombineEnabled({ id, isCombineEnabled });
  };

  const updateDroppableScroll = (id: DroppableId, newScroll: Position) => {
    // no need to update the application state if a collection is not occurring
    if (!collection) {
      return;
    }

    invariant(
      registry.droppable.exists(id),
      `Cannot update the scroll on Droppable ${id} as it is not registered`,
    );

    callbacks.updateDroppableScroll({ id, offset: newScroll });
  };

  const scrollDroppable = (id: DroppableId, change: Position) => {
    if (!collection) {
      return;
    }
    registry.droppable.getById(id).callbacks.scroll(change);
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
    registry.droppable
      .getAllByType(home.type)
      .forEach((entry: DroppableEntry) => entry.callbacks.dragStopped());

    // Unsubscribe from registry updates
    collection.unsubscribe();
    // Finally - clear our collection
    collection = null;
  };

  const subscriber: Subscriber = (event: RegistryEvent) => {
    invariant(
      collection,
      'Should only be subscribed when a collection is occurring',
    );
    // The dragging item can be add and removed when using a clone
    // We do not publish updates for the critical item
    const criticalId: DraggableId = collection.critical.draggable.id;

    if (event.type === 'ADDITION') {
      if (event.value.descriptor.id !== criticalId) {
        publisher.add(event.value);
      }
    }
    if (event.type === 'REMOVAL') {
      if (event.value.id !== criticalId) {
        publisher.remove(event.value);
      }
    }
  };

  const startPublishing = (request: LiftRequest): StartPublishingResult => {
    invariant(
      !collection,
      'Cannot start capturing critical dimensions as there is already a collection',
    );
    const entry: DraggableEntry = registry.draggable.getById(
      request.draggableId,
    );
    const home: DroppableEntry = registry.droppable.getById(
      entry.descriptor.droppableId,
    );

    const critical: Critical = {
      draggable: entry.descriptor,
      droppable: home.descriptor,
    };

    const unsubscribe = registry.subscribe(subscriber);

    collection = {
      critical,
      unsubscribe,
    };

    return getInitialPublish({
      critical,
      registry,
      scrollOptions: request.scrollOptions,
    });
  };

  const marshal: DimensionMarshal = {
    // Droppable changes
    updateDroppableIsEnabled,
    updateDroppableIsCombineEnabled,
    scrollDroppable,
    updateDroppableScroll,

    // Entry
    startPublishing,
    stopPublishing,
  };

  return marshal;
};
