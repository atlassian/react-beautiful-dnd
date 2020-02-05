// @flow
import { useEffect } from 'react';
import { useMemo } from 'use-memo-one';
import type { ContextId, ElementId } from '../../types';
import getBodyElement from '../get-body-element';

export function getId(key: string, contextId: ContextId): string {
  return `rbd-hidden-text-${key}-${contextId}`;
}

type Args = {|
  contextId: ContextId,
  key: string,
  text: string,
|};

export default function useHiddenTextElement({
  contextId,
  key,
  text,
}: Args): ElementId {
  const id: string = useMemo(() => getId(key, contextId), [contextId, key]);

  useEffect(
    function mount() {
      const el: HTMLElement = document.createElement('div');

      // identifier
      el.id = id;

      // add the description text
      el.textContent = text;

      // Using `display: none` prevent screen readers from reading this element in the document flow
      el.style.display = 'none';

      // Add to body
      getBodyElement().appendChild(el);

      return function unmount() {
        // Remove from body
        getBodyElement().removeChild(el);
      };
    },
    [id, text],
  );

  return id;
}
