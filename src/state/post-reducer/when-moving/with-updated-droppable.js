// @flow
import type {
  StateWhenUpdatesAllowed,
  DroppableDimension,
} from '../../../types';
import whenMoving from './index';
import patchDroppableMap from './patch-droppable-map';

export default (
  state: StateWhenUpdatesAllowed,
  updated: DroppableDimension,
): StateWhenUpdatesAllowed =>
  whenMoving({
    state,
    dimensions: patchDroppableMap(state.dimensions, updated),
  });
