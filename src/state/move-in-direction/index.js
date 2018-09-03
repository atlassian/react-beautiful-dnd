// @flow
import type { Position } from 'css-box-model';
import { subtract } from '../position';
import getHomeLocation from '../get-home-location';
import moveCrossAxis from './move-cross-axis';
import type { Result as MoveCrossAxisResult } from './move-cross-axis/move-cross-axis-types';
import moveToNextIndex from './move-to-next-place/move-to-next-index';
import type { Result as MoveToNextIndexResult } from './move-to-next-place/move-to-next-index/move-to-next-index-types';
import type {
  DraggingState,
  DragImpact,
  DraggableLocation,
  Direction,
} from '../../types';

type Args = {|
  state: DraggingState,
  type: 'MOVE_UP' | 'MOVE_RIGHT' | 'MOVE_DOWN' | 'MOVE_LEFT',
|};

export type Result = {|
  clientSelection: Position,
  impact: DragImpact,
  scrollJumpRequest: ?Position,
|};

const getClientSelection = (
  pageBorderBoxCenter: Position,
  currentScroll: Position,
): Position => subtract(pageBorderBoxCenter, currentScroll);

export default ({ state, type }: Args): ?Result => {
  const { droppable, isMainAxisMovementAllowed } = (() => {
    if (state.impact && state.impact.destination) {
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
      (type === 'MOVE_UP' || type === 'MOVE_DOWN')) ||
    (direction === 'horizontal' &&
      (type === 'MOVE_LEFT' || type === 'MOVE_RIGHT'));

  // This movement is not permitted right now
  if (isMovingOnMainAxis && !isMainAxisMovementAllowed) {
    return null;
  }

  const isMovingForward: boolean =
    type === 'MOVE_DOWN' || type === 'MOVE_RIGHT';

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

    return {
      impact: result.impact,
      clientSelection: getClientSelection(
        result.pageBorderBoxCenter,
        state.viewport.scroll.current,
      ),
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

  return {
    clientSelection: getClientSelection(
      result.pageBorderBoxCenter,
      state.viewport.scroll.current,
    ),
    impact: result.impact,
    scrollJumpRequest: null,
  };
};
