// @flow
import type { Position } from 'css-box-model';
import getDragImpact from '../../get-drag-impact';
import { add, subtract } from '../../position';
import getDimensionMapWithPlaceholder from '../../get-dimension-map-with-placeholder';
import getUserDirection from '../../user-direction/get-user-direction';
import type {
  DraggableDimension,
  DraggingState,
  ClientPositions,
  PagePositions,
  DragPositions,
  DragImpact,
  Viewport,
  DimensionMap,
  UserDirection,
  StateWhenUpdatesAllowed,
} from '../../../types';
import getShouldAnimateDraggablePlaceholder from '../../should-animate-draggable-placeholder';

type Args = {|
  state: StateWhenUpdatesAllowed,
  clientSelection?: Position,
  dimensions?: DimensionMap,
  viewport?: Viewport,
  // force a custom drag impact
  impact?: ?DragImpact,
  // provide a scroll jump request (optionally provided - and can be null)
  scrollJumpRequest?: ?Position,
|};

export default ({
  state,
  clientSelection: forcedClientSelection,
  dimensions: forcedDimensions,
  viewport: forcedViewport,
  impact: forcedImpact,
  scrollJumpRequest,
}: Args): StateWhenUpdatesAllowed => {
  // DRAGGING: can update position and impact
  // COLLECTING: can update position but cannot update impact

  const viewport: Viewport = forcedViewport || state.viewport;
  const currentWindowScroll: Position = viewport.scroll.current;
  const dimensions: DimensionMap = forcedDimensions || state.dimensions;
  const clientSelection: Position =
    forcedClientSelection || state.current.client.selection;

  const offset: Position = subtract(
    clientSelection,
    state.initial.client.selection,
  );

  const client: ClientPositions = {
    offset,
    selection: clientSelection,
    borderBoxCenter: add(state.initial.client.borderBoxCenter, offset),
  };

  const page: PagePositions = {
    selection: add(client.selection, currentWindowScroll),
    borderBoxCenter: add(client.borderBoxCenter, currentWindowScroll),
  };

  const current: DragPositions = {
    client,
    page,
  };

  const userDirection: UserDirection = getUserDirection(
    state.userDirection,
    state.current.page.borderBoxCenter,
    current.page.borderBoxCenter,
  );

  // Not updating impact while bulk collecting
  if (state.phase === 'COLLECTING') {
    return {
      // adding phase to appease flow (even though it will be overwritten by spread)
      phase: 'COLLECTING',
      ...state,
      dimensions,
      viewport,
      current,
      userDirection,
    };
  }

  const draggable: DraggableDimension =
    dimensions.draggables[state.critical.draggable.id];

  const newImpact: DragImpact =
    forcedImpact ||
    getDragImpact({
      pageBorderBoxCenter: page.borderBoxCenter,
      draggable,
      draggables: dimensions.draggables,
      droppables: dimensions.droppables,
      previousImpact: state.impact,
      viewport,
      userDirection,
    });

  const withUpdatedPlaceholders: DimensionMap = getDimensionMapWithPlaceholder({
    draggable,
    impact: newImpact,
    previousImpact: state.impact,
    dimensions,
  });

  const shouldAnimateDraggablePlaceholder: booealn = getShouldAnimateDraggablePlaceholder(
    state.shouldAnimateDraggablePlaceholder,
    state.critical.draggable,
    newImpact,
  );

  // dragging!
  const result: DraggingState = {
    ...state,
    current,
    userDirection,
    dimensions: withUpdatedPlaceholders,
    impact: newImpact,
    viewport,
    shouldAnimateDraggablePlaceholder,
    scrollJumpRequest: scrollJumpRequest || null,
    // client updates can be applied as a part of a jump scroll
    // this can be to immediately reverse movement to allow for a nice animation
    // into the final position
    forceShouldAnimate: scrollJumpRequest ? false : null,
  };

  return result;
};
