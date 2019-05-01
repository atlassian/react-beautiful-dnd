// @flow
import { useEffect } from 'react';
import { useCallback } from 'use-memo-one';
import type { DraggableId } from '../../types';
import getClosestDragHandle from './get-closest-drag-handle';

// $ExpectError - cannot find type
const listenerOptions: AddEventListenerOptions = {
  passive: false,
  capture: true,
};

export default function useSensorMarshal(
  contextId: string,
  canLift: (id: DraggableId) => boolean,
) {
  const onMouseDown = useCallback(
    (event: MouseEvent) => {
      if (event.defaultPrevented) {
        console.log('already handled');
        return;
      }

      const target: EventTarget = event.target;
      if (!(target instanceof HTMLElement)) {
        console.log('target is not a html element');
        return;
      }

      const id: ?DraggableId = getClosestDragHandle(contextId, target);

      if (id == null) {
        return;
      }

      if (!canLift(id)) {
        return;
      }

      // TODO: interactive element check
      // if(is)
      console.log('start drag of', id);
      event.preventDefault();
    },
    [canLift, contextId],
  );

  useEffect(() => {
    window.addEventListener('mousedown', onMouseDown, listenerOptions);

    return () => {
      window.removeEventListener('mousedown', onMouseDown, listenerOptions);
    };
  }, [onMouseDown]);
}
