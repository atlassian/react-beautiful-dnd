// @flow
import type { Position } from 'css-box-model';
import type {
  DraggableId,
  DroppableId,
  DraggableDescriptor,
  Published,
  DraggableDimension,
  DroppablePublish,
  DroppableIdMap,
  DraggableIdMap,
} from '../../types';
import type {
  DroppableEntry,
  Registry,
  DraggableEntry,
  DraggableEntryMap,
} from '../registry/registry-types';
import * as timings from '../../debug/timings';
import { origin } from '../position';

export type WhileDraggingPublisher = {|
  add: (entry: DraggableEntry) => void,
  remove: (entry: DraggableEntry) => void,
  stop: () => void,
|};

type Staging = {|
  additions: DraggableEntryMap,
  removals: DraggableIdMap,
  modified: DroppableIdMap,
|};

type Callbacks = {|
  publish: (args: Published) => mixed,
  collectionStarting: () => mixed,
|};

type Args = {|
  registry: Registry,
  callbacks: Callbacks,
|};

const clean = (): Staging => ({
  additions: {},
  removals: {},
  modified: {},
});

const timingKey: string = 'Publish collection from DOM';

export default function createPublisher({
  registry,
  callbacks,
}: Args): WhileDraggingPublisher {
  let staging: Staging = clean();
  let frameId: ?AnimationFrameID = null;

  const collect = () => {
    if (frameId) {
      return;
    }

    callbacks.collectionStarting();
    frameId = requestAnimationFrame(() => {
      frameId = null;
      timings.start(timingKey);

      const { additions, removals, modified } = staging;

      const added: DraggableDimension[] = Object.keys(additions)
        .map(
          // Using the origin as the window scroll. This will be adjusted when processing the published values
          (id: DraggableId): DraggableDimension =>
            registry.draggable.getById(id).getDimension(origin),
        )
        // Dimensions are not guarenteed to be ordered in the same order as keys
        // So we need to sort them so they are in the correct order
        .sort(
          (a: DraggableDimension, b: DraggableDimension): number =>
            a.descriptor.index - b.descriptor.index,
        );

      const updated: DroppablePublish[] = Object.keys(modified).map(
        (id: DroppableId) => {
          const entry: DroppableEntry = registry.droppable.getById(id);

          const scroll: Position = entry.callbacks.getScrollWhileDragging();
          return {
            droppableId: id,
            scroll,
          };
        },
      );

      const result: Published = {
        additions: added,
        removals: Object.keys(removals),
        modified: updated,
      };

      staging = clean();

      timings.finish(timingKey);
      callbacks.publish(result);
    });
  };

  const add = (entry: DraggableEntry) => {
    const id: DraggableId = entry.descriptor.id;
    staging.additions[id] = entry;
    staging.modified[entry.descriptor.droppableId] = true;

    if (staging.removals[id]) {
      delete staging.removals[id];
    }
    collect();
  };

  const remove = (entry: DraggableEntry) => {
    const descriptor: DraggableDescriptor = entry.descriptor;
    staging.removals[descriptor.id] = true;
    staging.modified[descriptor.droppableId] = true;

    if (staging.additions[descriptor.id]) {
      delete staging.additions[descriptor.id];
    }
    collect();
  };

  const stop = () => {
    if (!frameId) {
      return;
    }

    cancelAnimationFrame(frameId);
    frameId = null;
    staging = clean();
  };

  return {
    add,
    remove,
    stop,
  };
}
