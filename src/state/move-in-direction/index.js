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
import getPageBorderBoxCenter from '../get-center-from-impact/get-page-border-box-center';
import isTotallyVisibleInNewLocation from './move-to-next-place/is-totally-visible-in-new-location';
import { subtract } from '../position';
import { speculativelyIncrease } from './update-displacement-visibility';
import fromPageBorderBoxCenter from '../get-center-from-impact/get-client-border-box-center/from-page-border-box-center';

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
  const isActuallyOver: ?DroppableDimension = getDroppableOver(
    state.impact,
    state.dimensions.droppables,
  );
  const isMainAxisMovementAllowed: boolean = Boolean(isActuallyOver);
  const home: DroppableDimension =
    state.dimensions.droppables[state.critical.droppable.id];
  // use home when not actually over a droppable (can happen when move is disabled)
  const isOver: DroppableDimension = isActuallyOver || home;

  const direction: Direction = isOver.axis.direction;
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
  const previousPageBorderBoxCenter: Position =
    state.current.page.borderBoxCenter;
  const { draggables, droppables } = state.dimensions;
  const viewport: Viewport = state.viewport;

  const result: ?InternalResult = isMovingOnMainAxis
    ? moveToNextPlace({
        isMovingForward,
        draggable,
        destination: isOver,
        draggables,
        previousPageBorderBoxCenter,
        previousImpact: state.impact,
        viewport,
      })
    : moveCrossAxis({
        isMovingForward,
        previousPageBorderBoxCenter,
        draggable,
        isOver,
        draggables,
        droppables,
        previousImpact: state.impact,
        viewport,
      });

  if (!result) {
    return null;
  }

  // A move can update destination
  const destination: ?DroppableDimension = getDroppableOver(
    result.impact,
    state.dimensions.droppables,
  );
  invariant(
    destination,
    'Cannot move in direction and not move to a Droppable',
  );

  const pageBorderBoxCenter: Position = getPageBorderBoxCenter({
    impact: result.impact,
    draggable,
    droppable: destination,
    draggables,
  });

  const isVisibleInNewLocation: boolean = isTotallyVisibleInNewLocation({
    draggable,
    destination,
    newPageBorderBoxCenter: pageBorderBoxCenter,
    viewport: viewport.frame,
    // already taken into account by getPageBorderBoxCenter
    withDroppableDisplacement: false,
    // we only care about it being visible relative to the main axis
    // this is important with dynamic changes as scroll bar and toggle
    // on the cross axis during a drag
    onlyOnMainAxis: true,
  });

  if (isVisibleInNewLocation) {
    console.warn('👓 is visible in new position');
    // using the client center as the selection point
    const clientSelection: Position = fromPageBorderBoxCenter({
      pageBorderBoxCenter,
      draggable,
      viewport,
    });
    return {
      clientSelection,
      impact: result.impact,
      scrollJumpRequest: null,
    };
  }

  console.log('👻 not visible in new location');

  const distance: Position = subtract(
    pageBorderBoxCenter,
    previousPageBorderBoxCenter,
  );

  // need to guess the increased visible displacement
  // this is a worst case guess, which means that
  // it may visually displace things that do not need to
  // const updated: DragImpact = speculativelyIncrease({
  //   impact: result.impact,
  //   viewport,
  //   destination,
  //   draggables,
  //   maxScrollChange: distance,
  // });

  return {
    clientSelection: state.current.client.selection,
    impact: result.impact,
    scrollJumpRequest: distance,
  };
};
