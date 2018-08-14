// @flow
import type { Position } from 'css-box-model';
import * as timings from '../../debug/timings';
import type {
  Entries,
  DroppableEntry,
  DraggableEntry,
  StartPublishingResult,
} from './dimension-marshal-types';
import type {
  DraggableId,
  DroppableId,
  DroppableDescriptor,
  DroppableDimension,
  DraggableDimension,
  DraggableDimensionMap,
  DroppableDimensionMap,
  DimensionMap,
  ScrollOptions,
  Critical,
} from '../../types';

type Args = {|
  critical: Critical,
  scrollOptions: ScrollOptions,
  windowScroll: Position,
  entries: Entries,
|};

export default ({
  critical,
  scrollOptions,
  windowScroll,
  entries,
}: Args): StartPublishingResult => {
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
        entry.callbacks.getDimensionAndWatchScroll(windowScroll, scrollOptions),
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
