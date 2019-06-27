// @flow
import { useRef, useEffect } from 'react';
import invariant from 'tiny-invariant';
import { useMemo } from 'use-memo-one';
import type { DragHandleDescription, ContextId } from '../../types';
import getBodyElement from '../get-body-element';

// https://allyjs.io/tutorials/hiding-elements.html
// Element is visually hidden but is readable by screen readers
const visuallyHidden: Object = {
  position: 'absolute',
  width: '1px',
  height: '1px',
  margin: '-1px',
  border: '0',
  padding: '0',
  overflow: 'hidden',
  clip: 'rect(0 0 0 0)',
  // for if 'clip' is ever removed
  'clip-path': 'inset(100%)',
};

export const getId = (contextId: ContextId): string =>
  `rbd-drag-handle-description-${contextId}`;

export default function useDragHandleDescription(
  contextId: ContextId,
  description: DragHandleDescription,
): string {
  const id: string = useMemo(() => getId(contextId), [contextId]);
  const ref = useRef<?HTMLElement>(null);

  useEffect(() => {
    invariant(!ref.current, 'Description node already mounted');

    const el: HTMLElement = document.createElement('div');
    ref.current = el;

    // identifier
    el.id = id;

    // add the description text
    el.textContent = description;

    // hide the element visually
    Object.assign(el.style, visuallyHidden);

    // Add to body
    getBodyElement().appendChild(el);

    return () => {
      // unmounting after a timeout to let any annoucements
      // during a mount be published
      setTimeout(function remove() {
        const toBeRemoved: ?HTMLElement = ref.current;
        invariant(toBeRemoved, 'Cannot unmount description node');

        // Remove from body
        getBodyElement().removeChild(toBeRemoved);
        ref.current = null;
      });
    };
  }, [id, description]);

  return id;
}
