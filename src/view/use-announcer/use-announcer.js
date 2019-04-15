// @flow
import { useRef, useEffect } from 'react';
import invariant from 'tiny-invariant';
import { useMemoOne, useCallbackOne } from 'use-memo-one';
import type { Announce } from '../../types';
import { warning } from '../../dev-warning';
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

export const getId = (uniqueId: number): string =>
  `react-beautiful-dnd-announcement-${uniqueId}`;

export default function useAnnouncer(uniqueId: number): Announce {
  const id: string = useMemoOne(() => getId(uniqueId), [uniqueId]);
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
      const toBeRemoved: ?HTMLElement = ref.current;
      invariant(toBeRemoved, 'Cannot unmount announcement node');

      // Remove from body
      getBodyElement().removeChild(toBeRemoved);
      ref.current = null;
    };
  }, [id]);

  const announce: Announce = useCallbackOne((message: string): void => {
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
