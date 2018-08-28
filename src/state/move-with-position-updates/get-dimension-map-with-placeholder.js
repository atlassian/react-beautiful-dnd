// @flow
import type { Position } from 'css-box-model';
import { withPlaceholder, withoutPlaceholder } from '../droppable-dimension';
import { isEqual, patch } from '../position';
import type {
  DroppableDimension,
  DroppableId,
  DraggingState,
  CollectingState,
  DimensionMap,
  DraggableDimension,
  DragImpact,
  DraggableLocation,
} from '../../types';

type AcceptedState = DraggingState | CollectingState;

const clearUnusedPlaceholder = (
  state: AcceptedState,
  impact: DragImpact,
): DimensionMap => {
  const previous: ?DraggableLocation = state.impact.destination;
  const current: ?DraggableLocation = impact.destination;

  // no previous destination so there where no placeholders
  if (!previous) {
    return state.dimensions;
  }

  // no change in droppable - can maintain the last ones
  if (current && previous.droppableId === current.droppableId) {
    return state.dimensions;
  }

  const lastDroppable: DroppableDimension =
    state.dimensions.droppables[previous.droppableId];

  // nothing to clear
  if (!lastDroppable.subject.withPlaceholder) {
    return state.dimensions;
  }
  const patched: DroppableDimension = withoutPlaceholder(lastDroppable);

  // TODO: need to unwind any existing placeholders
  return {
    draggables: state.dimensions.draggables,
    droppables: {
      ...state.dimensions.droppables,
      [patched.descriptor.id]: patched,
    },
  };
};

type Args = {|
  state: AcceptedState,
  draggable: DraggableDimension,
  impact: DragImpact,
|};

export default ({ state: oldState, draggable, impact }: Args): DimensionMap => {
  const base: DimensionMap = clearUnusedPlaceholder(oldState, impact);
  const destination: ?DraggableLocation = impact.destination;
  if (!destination) {
    return base;
  }
  const droppableId: DroppableId = destination.droppableId;
  const isOverHome: boolean = Boolean(
    droppableId === oldState.critical.droppable.id,
  );

  if (isOverHome) {
    return base;
  }

  const droppable: DroppableDimension =
    base.droppables[destination.droppableId];

  // already have a placeholder - nothing to do here!
  if (droppable.subject.withPlaceholder) {
    return base;
  }

  const placeholderSize: Position = patch(
    droppable.axis.line,
    draggable.displaceBy[droppable.axis.line],
  );

  // Need to patch the existing droppable
  const patched: DroppableDimension = withPlaceholder(
    droppable,
    placeholderSize,
  );

  return {
    draggables: base.draggables,
    droppables: {
      ...base.droppables,
      [patched.descriptor.id]: patched,
    },
  };
};
