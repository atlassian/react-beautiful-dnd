// @flow
import type { Position } from 'css-box-model';
import { subtract } from '../position';
import getHomeLocation from '../get-home-location';
import moveCrossAxis from './move-cross-axis';
import type { Result as MoveCrossAxisResult } from './move-cross-axis/move-cross-axis-types';
import moveToNextIndex from './move-to-next-index';
import type { Result as MoveToNextIndexResult } from './move-to-next-index/move-to-next-index-types';
import type {
  DraggingState,
  DragImpact,
  DraggableLocation,
  Direction,
} from '../../types';

type Args = {|
  state: DraggingState,
  action: 'MOVE_UP' | 'MOVE_RIGHT' | 'MOVE_DOWN' | 'MOVE_LEFT',
|};

export type Result = {|
  clientSelection: Position,
  impact: DragImpact,
  scrollJumpRequest: ?Position,
|};

export default ({ state, action }: Args): ?Result => {
  const { droppable, isMainAxisMovementAllowed } = (() => {
    if (state.impact.destination) {
      return {
        droppable:
          state.dimensions.droppables[state.impact.destination.droppableId],
        isMainAxisMovementAllowed: true,
      };
    }

    // No destination - this can happen when lifting an a disabled droppable
    // In this case we want to allow movement out of the list with a keyboard
    // but not within the list
    return {
      droppable: state.dimensions.droppables[state.critical.droppable.id],
      isMainAxisMovementAllowed: false,
    };
  })();

  const direction: Direction = droppable.axis.direction;
  const isMovingOnMainAxis: boolean =
    (direction === 'vertical' &&
      (action === 'MOVE_UP' || action === 'MOVE_DOWN')) ||
    (direction === 'horizontal' &&
      (action === 'MOVE_LEFT' || action === 'MOVE_RIGHT'));

  // This movement is not permitted right now
  if (isMovingOnMainAxis && !isMainAxisMovementAllowed) {
    return null;
  }

  const isMovingForward: boolean =
    action === 'MOVE_DOWN' || action === 'MOVE_RIGHT';

  if (isMovingOnMainAxis) {
    const result: ?MoveToNextIndexResult = moveToNextIndex({
      isMovingForward,
      draggableId: state.critical.draggable.id,
      droppable,
      draggables: state.dimensions.draggables,
      previousPageBorderBoxCenter: state.current.page.borderBoxCenter,
      previousImpact: state.impact,
      viewport: state.viewport,
    });

    // Cannot move (at the beginning or end of a list)
    if (!result) {
      return null;
    }

    const impact: DragImpact = result.impact;
    const pageBorderBoxCenter: Position = result.pageBorderBoxCenter;
    // TODO: not sure if this is correct
    const clientBorderBoxCenter: Position = subtract(
      pageBorderBoxCenter,
      state.viewport.scroll.current,
    );

    return {
      impact,
      clientSelection: clientBorderBoxCenter,
      scrollJumpRequest: result.scrollJumpRequest,
    };
  }

  // moving on cross axis
  const home: DraggableLocation = getHomeLocation(state.critical);

  const result: ?MoveCrossAxisResult = moveCrossAxis({
    isMovingForward,
    pageBorderBoxCenter: state.current.page.borderBoxCenter,
    draggableId: state.critical.draggable.id,
    droppableId: droppable.descriptor.id,
    home,
    draggables: state.dimensions.draggables,
    droppables: state.dimensions.droppables,
    previousImpact: state.impact,
    viewport: state.viewport,
  });

  if (!result) {
    return null;
  }

  const clientSelection: Position = subtract(
    result.pageBorderBoxCenter,
    state.viewport.scroll.current,
  );

  return {
    clientSelection,
    impact: result.impact,
    scrollJumpRequest: null,
  };
};
