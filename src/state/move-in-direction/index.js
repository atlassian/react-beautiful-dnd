// @flow
import type { Position } from 'css-box-model';
import moveCrossAxis from './move-cross-axis';
import moveToNextPlace from './move-to-next-place';
import whatIsDraggedOver from '../droppable/what-is-dragged-over';
import type { InternalResult, PublicResult } from './move-in-direction-types';
import type { DroppableId, DraggingState, Direction } from '../../types';
import withScrollDisplacement from '../with-scroll-change/with-all-displacement';
import { subtract } from '../position';

type Args = {|
  state: DraggingState,
  type: 'MOVE_UP' | 'MOVE_RIGHT' | 'MOVE_DOWN' | 'MOVE_LEFT',
|};

const getDroppable = (state: DraggingState) => {
  const id: ?DroppableId = whatIsDraggedOver(state.impact);

  if (id) {
    return {
      droppable: state.dimensions.droppables[id],
      isMainAxisMovementAllowed: true,
    };
  }
  return {
    droppable: state.dimensions.droppables[state.critical.droppable.id],
    isMainAxisMovementAllowed: false,
  };
};

export default ({ state, type }: Args): ?PublicResult => {
  const { droppable, isMainAxisMovementAllowed } = getDroppable(state);
  const direction: Direction = droppable.axis.direction;
  const isMovingOnMainAxis: boolean =
    (direction === 'vertical' &&
      (type === 'MOVE_UP' || type === 'MOVE_DOWN')) ||
    (direction === 'horizontal' &&
      (type === 'MOVE_LEFT' || type === 'MOVE_RIGHT'));

  // This movement is not permitted right now
  if (isMovingOnMainAxis && !isMainAxisMovementAllowed) {
    return null;
  }

  const isMovingForward: boolean =
    type === 'MOVE_DOWN' || type === 'MOVE_RIGHT';

  const result: ?InternalResult = isMovingOnMainAxis
    ? moveToNextPlace({
        isMovingForward,
        draggableId: state.critical.draggable.id,
        destination: droppable,
        draggables: state.dimensions.draggables,
        previousPageBorderBoxCenter: state.current.page.borderBoxCenter,
        previousImpact: state.impact,
        viewport: state.viewport,
      })
    : moveCrossAxis({
        isMovingForward,
        pageBorderBoxCenter: state.current.page.borderBoxCenter,
        draggableId: state.critical.draggable.id,
        droppableId: droppable.descriptor.id,
        draggables: state.dimensions.draggables,
        droppables: state.dimensions.droppables,
        previousImpact: state.impact,
        viewport: state.viewport,
      });

  if (!result) {
    return null;
  }

  const withoutInitialPageScroll: Position = subtract(
    result.pageBorderBoxCenter,
    state.viewport.scroll.initial,
  );

  const withDisplacement: Position = withScrollDisplacement(
    withoutInitialPageScroll,
    droppable,
    state.viewport,
  );
  console.log('pageBorderBoxCenter', result.pageBorderBoxCenter);
  console.log('client selection', withDisplacement);

  return {
    clientSelection: withDisplacement,
    impact: result.impact,
    scrollJumpRequest: result.scrollJumpRequest,
  };
};
