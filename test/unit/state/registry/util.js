// @flow
import type {
  Id,
  DraggableDimension,
  DroppableDimension,
} from '../../../../src/types';
import type {
  DraggableEntry,
  DroppableEntry,
} from '../../../../src/state/registry/registry-types';
import { noop } from '../../../../src/empty';

type DraggableArgs = {
  uniqueId: Id,
  dimension: DraggableDimension,
};

export function getDraggableEntry({
  uniqueId,
  dimension,
}: DraggableArgs): DraggableEntry {
  return {
    uniqueId,
    descriptor: dimension.descriptor,
    options: {
      canDragInteractiveElements: true,
      shouldRespectForcePress: false,
      isEnabled: true,
    },
    getDimension: () => dimension,
  };
}

type DroppableArgs = {|
  uniqueId: Id,
  dimension: DroppableDimension,
|};

export function getDroppableEntry({
  uniqueId,
  dimension,
}: DroppableArgs): DroppableEntry {
  return {
    uniqueId,
    descriptor: dimension.descriptor,
    callbacks: {
      getDimensionAndWatchScroll: () => dimension,
      recollect: () => dimension,
      scroll: noop,
      dragStopped: noop,
    },
  };
}
