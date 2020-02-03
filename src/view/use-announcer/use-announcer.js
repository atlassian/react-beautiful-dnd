// @flow
import { useRef, useEffect } from 'react';
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

  useEffect(
    function setup() {
      const el: HTMLElement = document.createElement('div');
      // storing reference for usage in announce
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

      return function cleanup() {
        // Not clearing the ref as it might be used by announce before the timeout expires

        // unmounting after a timeout to let any announcements
        // during a mount be published
        setTimeout(function remove() {
          // not clearing the ref as it might have been set by a new effect
          getBodyElement().removeChild(el);

          // if el was the current ref - clear it so that
          // we can get a warning if announce is called
          if (el === ref.current) {
            ref.current = null;
          }
        });
      };
    },
    [id],
  );

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
