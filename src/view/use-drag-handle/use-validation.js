// @flow
import { useEffect } from 'react';
import invariant from 'tiny-invariant';
import getDragHandleRef from './util/get-drag-handle-ref';

type Args = {|
  isEnabled: boolean,
  getDraggableRef: () => ?HTMLElement,
|};

export default function useValidation({ isEnabled, getDraggableRef }: Args) {
  // validate ref on mount
  useEffect(() => {
    // wrapping entire block for better minification
    if (process.env.NODE_ENV !== 'production') {
      // There will be no drag handle ref when disabled
      if (!isEnabled) {
        return;
      }
      const draggableRef: ?HTMLElement = getDraggableRef();
      invariant(draggableRef, 'Drag handle was unable to find draggable ref');
      getDragHandleRef(draggableRef);
    }
  }, [getDraggableRef, isEnabled]);
}
