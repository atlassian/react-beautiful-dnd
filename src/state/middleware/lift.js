// @flow
import { invariant } from '../../invariant';
import type { DimensionMarshal } from '../dimension-marshal/dimension-marshal-types';
import type { State, ScrollOptions, LiftRequest } from '../../types';
import type { MiddlewareStore, Action, Dispatch } from '../store-types';
import {
  completeDrop,
  initialPublish,
  flush,
  beforeInitialCapture,
} from '../action-creators';
import validateDimensions from './util/validate-dimensions';

export default (marshal: DimensionMarshal) => ({
  getState,
  dispatch,
}: MiddlewareStore) => (next: Dispatch) => (action: Action): any => {
  if (action.type !== 'LIFT') {
    next(action);
    return;
  }
  const { id, clientSelection, movementMode } = action.payload;
  const initial: State = getState();

  // flush dropping animation if needed
  // this can change the descriptor of the dragging item
  // Will call the onDragEnd responders

  if (initial.phase === 'DROP_ANIMATING') {
    dispatch(completeDrop({ completed: initial.completed }));
  }

  invariant(getState().phase === 'IDLE', 'Unexpected phase to start a drag');

  // Removing any placeholders before we capture any starting dimensions
  dispatch(flush());

  // Let consumers know we are just about to publish
  // We are only publishing a small amount of information as
  // things might change as a result of the onBeforeCapture callback
  dispatch(beforeInitialCapture({ draggableId: id, movementMode }));

  // will communicate with the marshal to start requesting dimensions
  const scrollOptions: ScrollOptions = {
    shouldPublishImmediately: movementMode === 'SNAP',
  };
  const request: LiftRequest = {
    draggableId: id,
    scrollOptions,
  };
  // Let's get the marshal started!
  const { critical, dimensions, viewport } = marshal.startPublishing(request);

  validateDimensions(critical, dimensions);

  // Okay, we are good to start dragging now
  dispatch(
    initialPublish({
      critical,
      dimensions,
      clientSelection,
      movementMode,
      viewport,
    }),
  );
};
