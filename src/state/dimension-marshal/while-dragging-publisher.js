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
import { warning } from '../../dev-warning';

export type WhileDraggingPublisher = {|
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
  publish: (args: Published) => mixed,
  collectionStarting: () => mixed,
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

export default ({ getEntries, callbacks }: Args): WhileDraggingPublisher => {
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

      warning(`
        Advanced usage warning: you are adding or removing a dimension during a drag
        This an advanced feature.

        Please check out: https://github.com/atlassian/react-beautiful-dnd/blob/master/docs/guides/changes-while-dragging.md
        For more information
      `);
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

      const added: DraggableDimension[] = Object.keys(additions)
        .map(
          // Using the origin as the window scroll. This will be adjusted when processing the published values
          (id: DraggableId): DraggableDimension =>
            entries.draggables[id].getDimension(origin),
        )
        // Dimensions are not guarenteed to be ordered in the same order as keys
        // So we need to sort them so they are in the correct order
        .sort(
          (a: DraggableDimension, b: DraggableDimension): number =>
            a.descriptor.index - b.descriptor.index,
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
