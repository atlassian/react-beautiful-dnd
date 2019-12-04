// @flow
import type { Position } from 'css-box-model';
import type {
  DraggableDimension,
  DraggingState,
  ClientPositions,
  PagePositions,
  DragPositions,
  DragImpact,
  Viewport,
  DimensionMap,
  StateWhenUpdatesAllowed,
  DroppableDimensionMap,
} from '../../../types';
import getDragImpact from '../../get-drag-impact';
import { add, subtract } from '../../position';
import recomputePlaceholders from '../../recompute-placeholders';

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
    selection: add(client.selection, viewport.scroll.current),
    borderBoxCenter: add(client.borderBoxCenter, viewport.scroll.current),
    offset: add(client.offset, viewport.scroll.diff.value),
  };

  const current: DragPositions = {
    client,
    page,
  };

  // Not updating impact while bulk collecting
  if (state.phase === 'COLLECTING') {
    return {
      // adding phase to appease flow (even though it will be overwritten by spread)
      phase: 'COLLECTING',
      ...state,
      dimensions,
      viewport,
      current,
    };
  }

  const draggable: DraggableDimension =
    dimensions.draggables[state.critical.draggable.id];

  const newImpact: DragImpact =
    forcedImpact ||
    getDragImpact({
      pageOffset: page.offset,
      draggable,
      draggables: dimensions.draggables,
      droppables: dimensions.droppables,
      previousImpact: state.impact,
      viewport,
      afterCritical: state.afterCritical,
    });

  const withUpdatedPlaceholders: DroppableDimensionMap = recomputePlaceholders({
    draggable,
    impact: newImpact,
    previousImpact: state.impact,
    draggables: dimensions.draggables,
    droppables: dimensions.droppables,
  });
  // dragging!
  const result: DraggingState = {
    ...state,
    current,
    dimensions: {
      draggables: dimensions.draggables,
      droppables: withUpdatedPlaceholders,
    },
    impact: newImpact,
    viewport,
    scrollJumpRequest: scrollJumpRequest || null,
    // client updates can be applied as a part of a jump scroll
    // this can be to immediately reverse movement to allow for a nice animation
    // into the final position
    forceShouldAnimate: scrollJumpRequest ? false : null,
  };

  return result;
};
