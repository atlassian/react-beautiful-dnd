// @flow
import { useRef, useEffect } from 'react';
import invariant from 'tiny-invariant';
import { useMemo } from 'use-memo-one';
import type { ContextId, ElementId } from '../../types';
import getBodyElement from '../get-body-element';
import visuallyHidden from '../visually-hidden-style';

export const getId = (contextId: ContextId): string =>
  `rbd-lift-instruction-${contextId}`;

export default function useLiftInstruction(
  contextId: ContextId,
  liftInstruction: string,
): ElementId {
  const id: string = useMemo(() => getId(contextId), [contextId]);
  const ref = useRef<?HTMLElement>(null);

  useEffect(
    function mount() {
      invariant(!ref.current, 'Description node already mounted');

      const el: HTMLElement = document.createElement('div');
      ref.current = el;

      // identifier
      el.id = id;

      // add the description text
      el.textContent = liftInstruction;

      // hide the element visually
      Object.assign(el.style, visuallyHidden);

      // Add to body
      getBodyElement().appendChild(el);

      return function unmount() {
        const toBeRemoved: ?HTMLElement = ref.current;
        invariant(toBeRemoved, 'Cannot unmount description node');

        // Remove from body
        getBodyElement().removeChild(toBeRemoved);
        ref.current = null;
      };
    },
    [id, liftInstruction],
  );

  return id;
}
