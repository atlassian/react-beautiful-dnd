// @flow
import type { Position } from 'css-box-model';
import { withPlaceholder, withoutPlaceholder } from '../droppable-dimension';
import { patch } from '../position';
import shouldUsePlaceholder from '../droppable/should-use-placeholder';
import whatIsDraggedOver from '../droppable/what-is-dragged-over';
import type {
  DroppableDimension,
  DraggingState,
  CollectingState,
  DimensionMap,
  DraggableDimension,
  DragImpact,
  DroppableId,
} from '../../types';

type AcceptedState = DraggingState | CollectingState;

const clearUnusedPlaceholder = (
  state: AcceptedState,
  impact: DragImpact,
): DimensionMap => {
  const last: ?DroppableId = whatIsDraggedOver(state.impact);
  const now: ?DroppableId = whatIsDraggedOver(impact);

  if (!last) {
    return state.dimensions;
  }

  // no change - can keep the last state
  if (last === now) {
    return state.dimensions;
  }

  const lastDroppable: DroppableDimension = state.dimensions.droppables[last];

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
  const droppableId: ?DroppableId = whatIsDraggedOver(impact);
  if (!droppableId) {
    return base;
  }
  const usePlaceholder: boolean = shouldUsePlaceholder(
    droppableId,
    draggable.descriptor,
    impact,
  );

  if (!usePlaceholder) {
    return base;
  }

  const droppable: DroppableDimension = base.droppables[droppableId];

  // already have a placeholder - nothing to do here!
  if (droppable.subject.withPlaceholder) {
    return base;
  }

  const placeholderSize: Position = patch(
    droppable.axis.line,
    draggable.displaceBy[droppable.axis.line],
  );

  console.log('increasing droppable by', placeholderSize);

  // Need to patch the existing droppable
  const patched: DroppableDimension = withPlaceholder(
    droppable,
    placeholderSize,
    base.draggables,
  );

  console.log('before', droppable.subject.active);
  console.log('patched', patched.subject.active);

  return {
    draggables: base.draggables,
    droppables: {
      ...base.droppables,
      [patched.descriptor.id]: patched,
    },
  };
};
