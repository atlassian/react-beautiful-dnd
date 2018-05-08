// @flow
import invariant from 'tiny-invariant';
import {
  prepare,
  clean,
  completeDrop,
  initialPublish,
} from '../action-creators';
import type { DimensionMarshal } from '../dimension-marshal/dimension-marshal-types';
import type {
  Store,
  Action,
  State,
  DropAnimatingState,
  ScrollOptions,
  LiftRequest,
} from '../../types';

export default (getMarshal: () => ?DimensionMarshal) =>
  (store: Store) => (next: (Action) => mixed) => (action: Action): mixed => {
    if (action.type !== 'LIFT') {
      return next(action);
    }

    const marshal: ?DimensionMarshal = getMarshal();
    invariant(marshal, 'Cannot perform lift without marshal');

    // A lift is happening!
    const { getState, dispatch } = store;
    const { id, client, autoScrollMode, viewport } = action.payload;

    // Phase 1: Quickly finish any current drop animations
    const initial: State = getState();

    invariant(
      initial.phase === 'IDLE' || initial.phase === 'DROP_ANIMATING',
      `Cannot lift during phase ${initial.phase}`
    );

    // flush dropping animation if needed
    // this can change the descriptor of the dragging item
    if (initial.phase === 'DROP_ANIMATING') {
      const current: DropAnimatingState = initial;
      // Will call the onDragEnd hooks
      dispatch(completeDrop(current.pending.result));
      // Reset the state
      dispatch(clean());
    }

    // Flush required for react-motion
    dispatch(prepare());

    setTimeout(() => {
      // Phase 2: collect initial dimensions
      const state: State = getState();

      // drag cancelled before timeout finished
      if (state.phase !== 'PREPARING') {
        return;
      }

      // will communicate with the marshal to start requesting dimensions
      const scrollOptions: ScrollOptions = {
        shouldPublishImmediately: autoScrollMode === 'JUMP',
      };
      const request: LiftRequest = {
        draggableId: id,
        scrollOptions,
      };
      // Let's get the marshal started!
      const { critical, dimensions } = marshal.startPublishing(request, viewport.scroll);
      // Okay, we are good to start dragging now
      dispatch(initialPublish({
        critical,
        dimensions,
        client,
        autoScrollMode,
        viewport,
      }));

      // Start collecting all the other dimensions
      marshal.collect({ includeCritical: false });
    });

    return next(action);
  };

