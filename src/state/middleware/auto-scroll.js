
// @flow
import type { Position } from 'css-box-model';
import { bindActionCreators } from 'redux';
import createAutoScroller from '../auto-scroller';
import type { AutoScroller } from '../auto-scroller/auto-scroller-types';
import type { DimensionMarshal } from '../../state/dimension-marshal/dimension-marshal-types';
import { move } from '../action-creators';
import scrollWindow from '../../view/window/scroll-window';
import isDragEnding from './util/is-drag-ending';
import type {
  DraggableId,

  Store,
  State,
  Action,
} from '../../types';

// TODO: this is broken - good times
export default (getMarshal: () => DimensionMarshal) =>
  (store: Store) => (next: (Action) => mixed) => {
    const scroller: AutoScroller = createAutoScroller({
      ...bindActionCreators({
        // TODO: using next to avoid recursive calls to auto scrolling..
        move,
      }, next),
      scrollDroppable: (id: DraggableId, change: Position): void => {
        getMarshal().scrollDroppable(id, change);
      },
      scrollWindow,
    });

    return (action: Action): mixed => {
      // Need to cancel any pending auto scrolling when drag is ending
      if (isDragEnding(action)) {
        scroller.cancel();
        next(action);
        return;
      }

      // auto scroll happens in response to state changes
      // releasing all actions to the reducer first
      next(action);

      const state: State = store.getState();

      // Only want to auto scroll in the dragging phase
      // Not allowing auto scrolling while bulk collecting
      // This is to avoid a mismatch in scroll between the captured
      // viewport in one frame and published in the next
      // Also, jump scrolling would not occur during a BULK_COLLECTION
      // as no changes to the impact are permitted in that time
      if (state.phase !== 'DRAGGING') {
        return;
      }

      if (state.autoScrollMode === 'FLUID') {
        scroller.fluidScroll(state);
        return;
      }

      if (!state.scrollJumpRequest) {
        return;
      }

      scroller.jumpScroll(state);
    };
  };
