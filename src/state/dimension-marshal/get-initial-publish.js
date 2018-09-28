// @flow
import type { Position } from 'css-box-model';
import * as timings from '../../debug/timings';
import type {
  Entries,
  DroppableEntry,
  DraggableEntry,
  StartPublishingResult,
} from './dimension-marshal-types';
import { toDraggableMap, toDroppableMap } from '../dimension-structures';
import { values } from '../../native-with-fallback';
import type {
  DroppableDescriptor,
  DroppableDimension,
  DraggableDimension,
  DimensionMap,
  ScrollOptions,
  Critical,
  Viewport,
} from '../../types';
import getViewport from '../../view/window/get-viewport';

type Args = {|
  critical: Critical,
  scrollOptions: ScrollOptions,
  entries: Entries,
|};

export default ({
  critical,
  scrollOptions,
  entries,
}: Args): StartPublishingResult => {
  const timingKey: string = 'Initial collection from DOM';
  timings.start(timingKey);
  const viewport: Viewport = getViewport();
  const windowScroll: Position = viewport.scroll.current;

  const home: DroppableDescriptor = critical.droppable;

  const droppables: DroppableDimension[] = values(entries.droppables)
    // Exclude things of the wrong type
    .filter(
      (entry: DroppableEntry): boolean => entry.descriptor.type === home.type,
    )
    .map(
      (entry: DroppableEntry): DroppableDimension =>
        entry.callbacks.getDimensionAndWatchScroll(windowScroll, scrollOptions),
    );

  const draggables: DraggableDimension[] = values(entries.draggables)
    .filter(
      (entry: DraggableEntry): boolean =>
        entry.descriptor.type === critical.draggable.type,
    )
    .map(
      (entry: DraggableEntry): DraggableDimension =>
        entry.getDimension(windowScroll),
    );

  const dimensions: DimensionMap = {
    draggables: toDraggableMap(draggables),
    droppables: toDroppableMap(droppables),
  };

  timings.finish(timingKey);

  const result: StartPublishingResult = {
    dimensions,
    critical,
    viewport,
  };

  return result;
};
