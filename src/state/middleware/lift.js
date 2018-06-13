// @flow
import invariant from 'tiny-invariant';
import {
  prepare,
  completeDrop,
  initialPublish,
} from '../action-creators';
import type { DimensionMarshal } from '../dimension-marshal/dimension-marshal-types';
import type {
  Store,
  Action,
  State,
  ScrollOptions,
  LiftRequest,
} from '../../types';

export default (getMarshal: () => DimensionMarshal) => {
  let timeoutId: ?TimeoutID = null;

  const tryAbortCriticalCollection = () => {
    if (timeoutId == null) {
      return;
    }
    clearTimeout(timeoutId);
    timeoutId = null;
  };

  return ({ getState, dispatch }: Store) =>
    (next: (Action) => mixed) => (action: Action): mixed => {
    // a lift might be cancelled before we enter phase 2
      if (action.type === 'CLEAN') {
        tryAbortCriticalCollection();
        next(action);
        return;
      }

      if (action.type !== 'LIFT') {
        next(action);
        return;
      }

      invariant(!timeoutId, 'There should not be a pending complete lift phase when a lift action is fired');
      const marshal: DimensionMarshal = getMarshal();
      const { id, client, autoScrollMode, viewport } = action.payload;
      const initial: State = getState();

      // flush dropping animation if needed
      // this can change the descriptor of the dragging item
      // Will call the onDragEnd hooks
      if (initial.phase === 'DROP_ANIMATING') {
        dispatch(completeDrop(initial.pending.result));
      }

      const postFlushState: State = getState();
      invariant(postFlushState.phase === 'IDLE', 'Incorrect phase to start a drag');

      // Flush required for react-motion
      dispatch(prepare());

      timeoutId = setTimeout(() => {
        timeoutId = null;
        // Phase 2: collect initial dimensions
        const state: State = getState();
        invariant(state.phase === 'PREPARING', 'Invalid phase for completing lift');

        // will communicate with the marshal to start requesting dimensions
        const scrollOptions: ScrollOptions = {
          shouldPublishImmediately: autoScrollMode === 'JUMP',
        };
        const request: LiftRequest = {
          draggableId: id,
          scrollOptions,
        };
        // Let's get the marshal started!
        const { critical, dimensions } = marshal.startPublishing(request, viewport.scroll.current);
        // Okay, we are good to start dragging now
        dispatch(initialPublish({
          critical,
          dimensions,
          client,
          autoScrollMode,
          viewport,
        }));
      });
    };
};

