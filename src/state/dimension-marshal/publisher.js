// @flow
import invariant from 'tiny-invariant';
import type {
  DraggableId,
  DroppableId,
  Published,
  DraggableDimension,
  DroppableDimension,
  DraggableDescriptor,
} from '../../types';
import type { Entries, DroppableEntry } from './dimension-marshal-types';
import * as timings from '../../debug/timings';
import { origin } from '../position';

export type Publisher = {|
  add: (descriptor: DraggableDescriptor) => void,
  remove: (descriptor: DraggableDescriptor) => void,
  stop: () => void,
|};

type DraggableMap = {
  [id: DraggableId]: DraggableDescriptor,
};

type DroppableMap = {
  [id: DroppableId]: true,
};

type Staging = {|
  additions: DraggableMap,
  removals: DraggableMap,
  modified: DroppableMap,
|};

type Callbacks = {|
  publish: (args: Published) => void,
  collectionStarting: () => void,
|};

type Args = {|
  getEntries: () => Entries,
  callbacks: Callbacks,
|};

const clean = (): Staging => ({
  additions: {},
  removals: {},
  modified: {},
});

const timingKey: string = 'Publish collection from DOM';

export default ({ getEntries, callbacks }: Args): Publisher => {
  const advancedUsageWarning = (() => {
    // noop for production
    if (process.env.NODE_ENV === 'production') {
      return () => {};
    }

    let hasAnnounced: boolean = false;

    return () => {
      if (hasAnnounced) {
        return;
      }

      hasAnnounced = true;

      if (process.env.NODE_ENV === 'production') {
        return;
      }

      console.warn(
        `
        Advanced usage warning: you are adding or removing a dimension during a drag
        This an advanced feature used to support dynamic interactions such as lazy loading lists.

        Keep in mind the following restrictions:

        - Draggable's can only be added to Droppable's that are scroll containers
        - Adding a Droppable cannot impact the placement of other Droppables
          (it cannot push a Droppable on the page)

        (This warning will be stripped in production builds)
      `.trim(),
      );
    };
  })();

  let staging: Staging = clean();
  let frameId: ?AnimationFrameID = null;

  const collect = () => {
    advancedUsageWarning();

    if (frameId) {
      return;
    }

    frameId = requestAnimationFrame(() => {
      frameId = null;
      callbacks.collectionStarting();
      timings.start(timingKey);

      const entries: Entries = getEntries();
      const { additions, removals, modified } = staging;

      const added: DraggableDimension[] = Object.keys(additions).map(
        // Using the origin as the window scroll. This will be adjusted when processing the published values
        (id: DraggableId): DraggableDimension =>
          entries.draggables[id].getDimension(origin),
      );

      const updated: DroppableDimension[] = Object.keys(modified).map(
        (id: DroppableId) => {
          const entry: ?DroppableEntry = entries.droppables[id];
          invariant(entry, 'Cannot find dynamically added droppable in cache');
          return entry.callbacks.recollect();
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

  const add = (descriptor: DraggableDescriptor) => {
    staging.additions[descriptor.id] = descriptor;
    staging.modified[descriptor.droppableId] = true;

    if (staging.removals[descriptor.id]) {
      delete staging.removals[descriptor.id];
    }
    collect();
  };

  const remove = (descriptor: DraggableDescriptor) => {
    staging.removals[descriptor.id] = descriptor;
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
};
