// @flow
import invariant from 'tiny-invariant';
import * as timings from '../../debug/timings';
import type {
  DraggableId,
  DroppableId,
  DraggableDimension,
  DroppableDimension,
  ScrollOptions,
} from '../../types';
import type { ToBeCollected } from './dimension-marshal-types';

type Collected = {|
  draggables: DraggableDimension[],
  droppables: DroppableDimension[],
|}

type Args = {|
  getToBeCollected: () => ToBeCollected,
  getDraggable: (id: DraggableId) => DraggableDimension,
  getDroppable: (id: DroppableId) => DroppableDimension,
  publish: (droppables: DroppableDimension[], draggables: DraggableDimension[]) => void,
|}

export type Collector = {|
  start: (options: ScrollOptions) => void,
  stop: () => void,
  collect: () => void,
|}

export default ({
  publish,
  getDraggable,
  getDroppable,
  getToBeCollected,
}: Args): Collector => {
  let isActive: boolean = false;
  let frameId: ?AnimationFrameID = null;
  let isQueued: boolean = false;
  let isRunning: boolean = false;

  const collectFromDOM = (toBeCollected: ToBeCollected): Collected => {
    const droppables: DroppableDimension[] = toBeCollected.droppables
      .map((id: DroppableId): DroppableDimension => getDroppable(id));

    const draggables: DraggableDimension[] = toBeCollected.draggables
      .map((id: DraggableId): DraggableDimension => getDraggable(id));

    return { draggables, droppables };
  };

  const run = () => {
    invariant(isRunning, 'Cannot start a new run when a run is already occurring');

    isRunning = true;

    // Perform DOM collection in next frame
    frameId = requestAnimationFrame(() => {
      timings.start('DOM collection');
      const toBeCollected: ToBeCollected = getToBeCollected();
      const collected: Collected = collectFromDOM(toBeCollected);
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

  const start = () => {
    invariant(!isActive, 'Collector has already been started');
    isActive = true;
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
  };

  return {
    start,
    stop,
    collect,
  };
};
