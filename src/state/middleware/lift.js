// @flow
import invariant from 'tiny-invariant';
import {
  prepare,
  completeDrop,
  initialPublish,
} from '../action-creators';
import canStartDrag from '../can-start-drag';
import type { DimensionMarshal } from '../dimension-marshal/dimension-marshal-types';
import type {
  Store,
  Action,
  State,
  DropAnimatingState,
  ScrollOptions,
  LiftRequest,
} from '../../types';

export default (getMarshal: () => DimensionMarshal) =>
  ({ getState, dispatch }: Store) => (next: (Action) => mixed) => (action: Action): mixed => {
    if (action.type !== 'LIFT') {
      next(action);
      return;
    }

    const marshal: DimensionMarshal = getMarshal();
    const { id, client, autoScrollMode, viewport } = action.payload;
    const initial: State = getState();

    invariant(canStartDrag(initial, action.payload.id), 'canStartDrag test not passed');

    // flush dropping animation if needed
    // this can change the descriptor of the dragging item
    if (initial.phase === 'DROP_ANIMATING') {
      const current: DropAnimatingState = initial;
      // Will call the onDragEnd hooks
      dispatch(completeDrop(current.pending.result));
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
      const { critical, dimensions } = marshal.startPublishing(request, viewport.scroll.current);
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
  };

