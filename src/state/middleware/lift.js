// @flow
import invariant from 'tiny-invariant';
import { completeDrop, initialPublish } from '../action-creators';
import type { DimensionMarshal } from '../dimension-marshal/dimension-marshal-types';
import type { State, ScrollOptions, LiftRequest } from '../../types';
import type { MiddlewareStore, Action, Dispatch } from '../store-types';

export default (getMarshal: () => DimensionMarshal) => ({
  getState,
  dispatch,
}: MiddlewareStore) => (next: Dispatch) => (action: Action): any => {
  if (action.type !== 'LIFT') {
    next(action);
    return;
  }

  const marshal: DimensionMarshal = getMarshal();
  const { id, client, autoScrollMode, viewport } = action.payload;
  const initial: State = getState();

  // flush dropping animation if needed
  // this can change the descriptor of the dragging item
  // Will call the onDragEnd hooks
  if (initial.phase === 'DROP_ANIMATING') {
    dispatch(completeDrop(initial.pending.result));
  }

  invariant(getState().phase === 'IDLE', 'Incorrect phase to start a drag');

  // will communicate with the marshal to start requesting dimensions
  const scrollOptions: ScrollOptions = {
    shouldPublishImmediately: autoScrollMode === 'JUMP',
  };
  const request: LiftRequest = {
    draggableId: id,
    scrollOptions,
  };
  // Let's get the marshal started!
  const { critical, dimensions } = marshal.startPublishing(
    request,
    viewport.scroll.current,
  );

  // Okay, we are good to start dragging now
  dispatch(
    initialPublish({
      critical,
      dimensions,
      client,
      autoScrollMode,
      viewport,
    }),
  );
};
