// @flow
import invariant from 'tiny-invariant';
import type { Position } from 'css-box-model';
import moveCrossAxis from './move-cross-axis';
import moveToNextPlace from './move-to-next-place';
import whatIsDraggedOver from '../droppable/what-is-dragged-over';
import type { InternalResult, PublicResult } from './move-in-direction-types';
import type {
  DroppableId,
  DraggingState,
  Direction,
  DroppableDimension,
  DraggableDimension,
  DroppableDimensionMap,
  DragImpact,
} from '../../types';
import withViewportDisplacement from '../with-scroll-change/with-viewport-displacement';
import { subtract, isEqual } from '../position';
import getClientBorderBoxCenter from '../get-center-from-impact/get-client-border-box-center';
import getPageBorderBoxCenter from '../get-center-from-impact/get-page-border-box-center';

type Args = {|
  state: DraggingState,
  type: 'MOVE_UP' | 'MOVE_RIGHT' | 'MOVE_DOWN' | 'MOVE_LEFT',
|};

const getDroppableOver = (
  impact: DragImpact,
  droppables: DroppableDimensionMap,
): ?DroppableDimension => {
  const id: ?DroppableId = whatIsDraggedOver(impact);
  return id ? droppables[id] : null;
};

export default ({ state, type }: Args): ?PublicResult => {
  const isOver: ?DroppableDimension = getDroppableOver(
    state.impact,
    state.dimensions.droppables,
  );
  const isMainAxisMovementAllowed: boolean = Boolean(isOver);
  const home: DroppableDimension =
    state.dimensions.droppables[state.critical.droppable.id];
  const useDroppable: DroppableDimension = isOver || home;

  const direction: Direction = useDroppable.axis.direction;
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

  const draggable: DraggableDimension =
    state.dimensions.draggables[state.critical.draggable.id];

  const result: ?InternalResult = isMovingOnMainAxis
    ? moveToNextPlace({
        isMovingForward,
        draggableId: state.critical.draggable.id,
        destination: useDroppable,
        draggables: state.dimensions.draggables,
        previousPageBorderBoxCenter: state.current.page.borderBoxCenter,
        previousImpact: state.impact,
        viewport: state.viewport,
      })
    : moveCrossAxis({
        isMovingForward,
        previousPageBorderBoxCenter: state.current.page.borderBoxCenter,
        draggableId: state.critical.draggable.id,
        droppableId: useDroppable.descriptor.id,
        draggables: state.dimensions.draggables,
        droppables: state.dimensions.droppables,
        previousImpact: state.impact,
        viewport: state.viewport,
      });

  if (!result) {
    return null;
  }

  if (result.type === 'SCROLL_JUMP') {
    return {
      clientSelection: state.current.client.selection,
      impact: result.impact,
      scrollJumpRequest: result.request,
    };
  }

  // A move can update destination
  const newDroppable: ?DroppableDimension = getDroppableOver(
    result.impact,
    state.dimensions.droppables,
  );
  invariant(
    newDroppable,
    'Cannot move in direction and not move to a Droppable',
  );

  const clientSelection: Position = getClientBorderBoxCenter({
    impact: result.impact,
    draggable,
    droppable: newDroppable,
    draggables: state.dimensions.draggables,
    viewport: state.viewport,
  });

  return {
    clientSelection,
    impact: result.impact,
    scrollJumpRequest: null,
  };
};
