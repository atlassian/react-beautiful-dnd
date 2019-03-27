// @flow
import invariant from 'tiny-invariant';
import { completeDrop, initialPublish } from '../action-creators';
import type { DimensionMarshal } from '../dimension-marshal/dimension-marshal-types';
import type { State, ScrollOptions, LiftRequest } from '../../types';
import type { MiddlewareStore, Action, Dispatch } from '../store-types';

export default (marshal: DimensionMarshal) => ({
  getState,
  dispatch,
}: MiddlewareStore) => (next: Dispatch) => (action: Action): any => {
  if (action.type !== 'LIFT') {
    next(action);
    return;
  }
  console.log('LIFT action');

  const { id, clientSelection, movementMode } = action.payload;
  const initial: State = getState();

  // flush dropping animation if needed
  // this can change the descriptor of the dragging item
  // Will call the onDragEnd responders
  if (initial.phase === 'DROP_ANIMATING') {
    dispatch(completeDrop({ completed: initial.completed, shouldFlush: true }));
  }

  invariant(getState().phase === 'IDLE', 'Incorrect phase to start a drag');

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
