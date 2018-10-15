// @flow
import type { Position } from 'css-box-model';
import type {
  StateWhenUpdatesAllowed,
  DragImpact,
  Viewport,
  DimensionMap,
} from '../../../types';
import refreshSnap, { type Result } from './refresh-snap';
import update from './update';

type Args = {|
  state: StateWhenUpdatesAllowed,

  dimensions?: DimensionMap,
  viewport?: Viewport,
  noSnapUpdate?: boolean,
  impact?: ?DragImpact,
  // Only relevant for non-snap updates
  // force a custom drag impact
  clientSelection?: Position,
  scrollJumpRequest?: ?Position,
|};

export default ({
  state,
  dimensions,
  viewport,
  impact,
  noSnapUpdate,
  // only relevant for non-snap refresh updates
  clientSelection,
  scrollJumpRequest,
}: Args) => {
  const shouldRefreshSnap: boolean =
    !noSnapUpdate && state.movementMode === 'SNAP';

  if (!shouldRefreshSnap) {
    return update({
      state,
      dimensions,
      viewport,
      impact,
      clientSelection,
      scrollJumpRequest,
    });
  }

  const result: Result = refreshSnap({
    state,
    dimensions,
    viewport,
  });

  return update({
    state,
    dimensions,
    viewport,
    impact: result.impact,
    clientSelection: result.clientSelection,
  });
};
