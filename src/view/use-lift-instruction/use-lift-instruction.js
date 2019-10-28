// @flow
import { useEffect } from 'react';
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

  useEffect(
    function mount() {
      const el: HTMLElement = document.createElement('div');

      // identifier
      el.id = id;

      // add the description text
      el.textContent = liftInstruction;

      // hide the element visually
      Object.assign(el.style, visuallyHidden);

      // Add to body
      getBodyElement().appendChild(el);

      return function unmount() {
        // Remove from body
        getBodyElement().removeChild(el);
      };
    },
    [id, liftInstruction],
  );

  return id;
}
