// @flow
import type { Position } from 'css-box-model';
import { withPlaceholder, withoutPlaceholder } from '../droppable-dimension';
import { isEqual, patch, origin } from '../position';
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

const clearPlaceholder = (state: AcceptedState): DimensionMap => {
  const previous: ?DraggableLocation = state.impact.destination;

  // no previous destination
  if (!previous) {
    return state.dimensions;
  }

  const droppable: DroppableDimension =
    state.dimensions.droppables[previous.droppableId];

  // Already does not have a placeholder
  if (isEqual(droppable.subject.withPlaceholderSize, origin)) {
    return state.dimensions;
  }

  const patched: DroppableDimension = withoutPlaceholder(droppable);

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

export default ({ state, draggable, impact }: Args): DimensionMap => {
  const destination: ?DraggableLocation = impact.destination;
  if (!destination) {
    return clearPlaceholder(state);
  }
  const droppableId: DroppableId = destination.droppableId;
  const isOverHome: boolean = Boolean(
    droppableId === state.critical.droppable.id,
  );

  if (isOverHome) {
    return state.dimensions;
  }

  const droppable: DroppableDimension =
    state.dimensions.droppables[destination.droppableId];

  const placeholderSize: Position = patch(
    droppable.axis.line,
    draggable.displaceBy[droppable.axis.line],
  );

  if (isEqual(droppable.subject.withPlaceholderSize, placeholderSize)) {
    return state.dimensions;
  }

  // Need to patch the existing droppable
  const patched: DroppableDimension = withPlaceholder(
    droppable,
    placeholderSize,
  );

  // TODO: need to unwind any existing placeholders
  return {
    draggables: state.dimensions.draggables,
    droppables: {
      ...state.dimensions.droppables,
      [patched.descriptor.id]: patched,
    },
  };
};
