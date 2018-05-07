// @flow
import invariant from 'tiny-invariant';
import * as timings from '../../debug/timings';
import type {
  DraggableId,
  DroppableId,
  DraggableDimension,
  DroppableDimension,
  DroppableDescriptor,
  DraggableDescriptor,
  ScrollOptions,
} from '../../types';
import type {
  Entries,
  DraggableEntry,
  DroppableEntry,
  Collection,
} from './dimension-marshal-types';

export type Collector = {|
  start: (collection: Collection) => void,
  stop: () => void,
  collect: () => void,
|}

type Collected = {|
  draggables: DraggableDimension[],
  droppables: DroppableDimension[],
|}

type InternalOptions = {|
  includeCritical: boolean,
|}

type Args = {|
  getEntries: () => Entries,
  publish: (droppables: DroppableDimension[], draggables: DraggableDimension[]) => void,
|}

const defaultOptions: InternalOptions = {
  includeCritical: true,
};

export default ({
  publish,
  getEntries,
}: Args): Collector => {
  let frameId: ?AnimationFrameID = null;
  let isActive: boolean = false;
  let collection: ?Collection;
  let isQueued: boolean = false;
  let isRunning: boolean = false;

  const collectFromDOM = (options: InternalOptions): Collected => {
    invariant(isActive, 'Should not collect when not active');
    invariant(collection, 'Need collection options to pull from DOM');

    const entries: Entries = getEntries();
    const home: DroppableDescriptor = collection.critical.droppable;
    const dragging: DraggableDescriptor = collection.critical.draggable;
    const scrollOptions: ScrollOptions = collection.scrollOptions;

    // 1. Figure out what we need to collect

    const droppables: DroppableEntry[] = Object.keys(entries.droppables)
      .map((id: DroppableId): DroppableEntry => entries.droppables[id])
      // Exclude things of the wrong type
      .filter((entry: DroppableEntry): boolean => entry.descriptor.type === home.type)
      // Exclude the critical droppable if needed
      .filter((entry: DroppableEntry): boolean => {
        if (options.includeCritical) {
          return true;
        }

        return entry.descriptor.id !== home.id;
      });

    const draggables: DraggableEntry[] = Object.keys(entries.draggables)
      .map((id: DraggableId): DraggableEntry => entries.draggables[id])
      // Exclude things of the wrong type
      .filter((entry: DraggableEntry): boolean => {
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
      })
      .filter((entry: DraggableEntry): boolean => {
        // Exclude the critical draggable if needed
        if (options.includeCritical) {
          return true;
        }
        return entry.descriptor.id !== dragging.id;
      });

    // 2. Tell all droppables to show their placeholders

    droppables.forEach((entry: DroppableEntry) => entry.callbacks.hidePlaceholder());

    // 3. Do the collection from the DOM

    const droppableDimensions: DroppableDimension[] =
      droppables.map((entry: DroppableEntry): DroppableDimension =>
        entry.callbacks.getDimensionAndWatchScroll(scrollOptions));

    const draggableDimensions: DraggableDimension[] =
      draggables.map((entry: DraggableEntry): DraggableDimension => entry.getDimension());

    // 4. Tell all the droppables to show their placeholders
    droppables.forEach((entry: DroppableEntry) => entry.callbacks.showPlaceholder());

    return {
      droppables: droppableDimensions,
      draggables: draggableDimensions,
    };
  };

  const run = (options?: InternalOptions = defaultOptions) => {
    invariant(!isRunning, 'Cannot start a new run when a run is already occurring');

    isRunning = true;

    // Perform DOM collection in next frame
    frameId = requestAnimationFrame(() => {
      timings.start('DOM collection');
      const collected: Collected = collectFromDOM(options);
      timings.finish('DOM collection');

      // Perform publish in next frame
      frameId = requestAnimationFrame(() => {
        timings.start('Bulk dimension publish');
        publish(collected.droppables, collected.draggables);
        timings.finish('Bulk dimension publish');

        // TODO: what if publish caused collection?

        frameId = null;
        isRunning = false;

        if (isQueued) {
          isQueued = false;
          run();
        }
      });
    });
  };

  const start = (options: Collection) => {
    invariant(!isActive, 'Collector has already been started');
    isActive = true;
    collection = options;

    // Start a collection - but there is no need to collect the
    // critical dimensions as they have already been collected
    run({ includeCritical: false });
  };

  const collect = () => {
    invariant(isActive, 'Can only collect when active');
    // A run is already queued
    if (isQueued) {
      return;
    }

    // We are running and a collection is not queued
    // Queue another run
    if (isRunning) {
      isQueued = true;
      return;
    }

    run();
  };

  const stop = () => {
    if (frameId) {
      cancelAnimationFrame(frameId);
    }
    isRunning = false;
    isQueued = false;
    isActive = false;
    collection = null;
  };

  return {
    start,
    stop,
    collect,
  };
};
