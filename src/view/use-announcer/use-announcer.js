// @flow
import { useRef, useEffect } from 'react';
import invariant from 'tiny-invariant';
import { useMemo, useCallback } from 'use-memo-one';
import type { Announce, ContextId } from '../../types';
import { warning } from '../../dev-warning';
import getBodyElement from '../get-body-element';
import visuallyHidden from '../visually-hidden-style';

export const getId = (contextId: ContextId): string =>
  `rbd-announcement-${contextId}`;

export default function useAnnouncer(contextId: ContextId): Announce {
  const id: string = useMemo(() => getId(contextId), [contextId]);
  const ref = useRef<?HTMLElement>(null);

  useEffect(() => {
    invariant(!ref.current, 'Announcement node already mounted');

    const el: HTMLElement = document.createElement('div');
    ref.current = el;

    // identifier
    el.id = id;

    // Aria live region

    // will force itself to be read
    el.setAttribute('aria-live', 'assertive');
    el.setAttribute('role', 'log');
    // must read the whole thing every time
    el.setAttribute('aria-atomic', 'true');

    // hide the element visually
    Object.assign(el.style, visuallyHidden);

    // Add to body
    getBodyElement().appendChild(el);

    return () => {
      // unmounting after a timeout to let any annoucements
      // during a mount be published
      setTimeout(function remove() {
        const toBeRemoved: ?HTMLElement = ref.current;
        invariant(toBeRemoved, 'Cannot unmount announcement node');

        // Remove from body
        getBodyElement().removeChild(toBeRemoved);
        ref.current = null;
      });
    };
  }, [id]);

  const announce: Announce = useCallback((message: string): void => {
    const el: ?HTMLElement = ref.current;
    if (el) {
      el.textContent = message;
      return;
    }

    warning(`
      A screen reader message was trying to be announced but it was unable to do so.
      This can occur if you unmount your <DragDropContext /> in your onDragEnd.
      Consider calling provided.announce() before the unmount so that the instruction will
      not be lost for users relying on a screen reader.

      Message not passed to screen reader:

      "${message}"
    `);
  }, []);

  return announce;
}
