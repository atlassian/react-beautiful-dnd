// @flow
import { useEffect } from 'react';
import invariant from 'tiny-invariant';
import getDragHandleRef from './util/get-drag-handle-ref';

export default function useValidation(getDraggableRef: () => ?HTMLElement) {
  // validate ref on mount
  useEffect(() => {
    if (process.env.NODE_ENV === 'production') {
      return;
    }
    const draggableRef: ?HTMLElement = getDraggableRef();
    invariant(draggableRef, 'Drag handle was unable to find draggable ref');

    getDragHandleRef(draggableRef);
  }, [getDraggableRef]);
}
