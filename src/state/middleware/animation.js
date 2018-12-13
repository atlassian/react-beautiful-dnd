// @flow
import type { Action, Dispatch } from '../store-types';
import type { DraggableDimension } from '../../types';
import type { AnimationMarshal } from '../../view/dom-nodes/animation-marshal/animation-marshal';

export default (marshal: AnimationMarshal) => () => (next: Dispatch) => (
  action: Action,
): any => {
  if (action.type === 'INITIAL_PUBLISH') {
    // okay lift is just about to happen
    const draggable: DraggableDimension =
      action.payload.dimensions.draggables[
        action.payload.critical.draggable.id
      ];
    marshal.onDragStart(draggable.placeholder);
  }

  if (action.type === 'CLEAN' || action.type === 'DROP_COMPLETE') {
    marshal.onDragEnd();
  }

  next(action);
};
