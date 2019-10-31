// @flow
import { useEffect } from 'react';
import { useMemo } from 'use-memo-one';
import type { ContextId, ElementId } from '../../types';
import getBodyElement from '../get-body-element';

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

      // prevent AT from idly reading it. Fixes #1568
      Object.assign(el.style, { display: 'none' });

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
