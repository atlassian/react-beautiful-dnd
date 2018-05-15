// @flow
import invariant from 'tiny-invariant';
import { type Position } from 'css-box-model';
import * as timings from '../../debug/timings';
import getViewport from '../../view/window/get-viewport';
import type { BulkReplaceArgs } from '../action-creators';
import type {
  DraggableId,
  DroppableId,
  DraggableDimension,
  DroppableDimension,
  DroppableDescriptor,
  DraggableDescriptor,
  ScrollOptions,
  Viewport,
  DroppableDimensionMap,
  DraggableDimensionMap,
  DimensionMap,
  Critical,
} from '../../types';
import type {
  Entries,
  DraggableEntry,
  DroppableEntry,
} from './dimension-marshal-types';

type CollectArgs = {|
  includeCritical: boolean,
|}

type CollectFromDOMArgs = {|
  ...CollectArgs,
  windowScroll: Position
|}

export type Collector = {|
  stop: () => void,
  collect: (args: CollectArgs) => void,
|}

type Args = {|
  getEntries: () => Entries,
  getCritical: () => Critical,
  getScrollOptions: () => ScrollOptions,
  bulkReplace: (args: BulkReplaceArgs) => void,
|}

export default ({
  bulkReplace,
  getEntries,
  getCritical,
  getScrollOptions,
}: Args): Collector => {
  let frameId: ?AnimationFrameID = null;
  // tmep
  let timerId: ?TimeoutID = null;

  const collectFromDOM = ({ windowScroll, includeCritical }: CollectFromDOMArgs): DimensionMap => {
    const critical: Critical = getCritical();
    const scrollOptions: ScrollOptions = getScrollOptions();
    const entries: Entries = getEntries();
    const home: DroppableDescriptor = critical.droppable;
    const dragging: DraggableDescriptor = critical.draggable;

    // 1. Figure out what we need to collect

    const droppables: DroppableEntry[] = Object.keys(entries.droppables)
      .map((id: DroppableId): DroppableEntry => entries.droppables[id])
      // Exclude things of the wrong type
      .filter((entry: DroppableEntry): boolean => entry.descriptor.type === home.type)
      // Exclude the critical droppable if needed
      .filter((entry: DroppableEntry): boolean => {
        if (includeCritical) {
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
        if (includeCritical) {
          return true;
        }
        return entry.descriptor.id !== dragging.id;
      });

    // 2. Tell all droppables to show their placeholders

    droppables.forEach((entry: DroppableEntry) => entry.callbacks.hidePlaceholder());

    // 3. Do the collection from the DOM

    const droppableDimensions: DroppableDimensionMap = droppables
      .map((entry: DroppableEntry): DroppableDimension =>
        entry.callbacks.getDimensionAndWatchScroll(windowScroll, scrollOptions))
      .reduce((previous: DroppableDimensionMap, current: DroppableDimension) => {
        previous[current.descriptor.id] = current;
        return previous;
      }, {});

    const draggableDimensions: DraggableDimensionMap = draggables
      .map((entry: DraggableEntry): DraggableDimension => entry.getDimension(windowScroll))
      .reduce((previous: DraggableDimensionMap, current: DraggableDimension) => {
        previous[current.descriptor.id] = current;
        return previous;
      }, {});

    // 4. Tell all the droppables to show their placeholders
    droppables.forEach((entry: DroppableEntry) => entry.callbacks.showPlaceholder());

    return {
      droppables: droppableDimensions,
      draggables: draggableDimensions,
    };
  };

  const abortFrame = () => {
    if (!frameId) {
      return;
    }
    cancelAnimationFrame(frameId);
    frameId = null;
  };

  const collect = ({ includeCritical }: CollectArgs) => {
    abortFrame();
    clearTimeout(timerId);

    // Perform DOM collection in next frame
    frameId = requestAnimationFrame(() => {
      timings.start('DOM collection');
      const viewport: Viewport = getViewport();
      const critical: Critical = getCritical();
      const dimensions: DimensionMap = collectFromDOM({
        windowScroll: viewport.scroll,
        includeCritical,
      });
      timings.finish('DOM collection');

      console.log('include critical?', includeCritical);

      // Perform publish in next frame
      frameId = requestAnimationFrame(() => {
        console.log('waiting a really long time for publish');
        timerId = setTimeout(() => {
          timings.start('Bulk dimension publish');
          bulkReplace({
            dimensions,
            viewport,
            critical: includeCritical ? critical : null,
          });
          timings.finish('Bulk dimension publish');
        }, 2000);
        frameId = null;
      });
    });
  };

  const stop = () => {
    abortFrame();
  };

  return {
    collect,
    stop,
  };
};
