// @flow
import { useRef, useEffect } from 'react';
import invariant from 'tiny-invariant';
import type { DraggableId, ContextId } from '../../types';
import type { Props } from './draggable-types';
import checkIsValidInnerRef from '../check-is-valid-inner-ref';
import { warning } from '../../dev-warning';
import findDragHandle from '../get-elements/find-drag-handle';

function prefix(id: DraggableId): string {
  return `Draggable[id: ${id}]: `;
}

export function useValidation(
  props: Props,
  contextId: ContextId,
  getRef: () => ?HTMLElement,
) {
  // running after every update in development
  useEffect(() => {
    // wrapping entire block for better minification
    if (process.env.NODE_ENV !== 'production') {
      const id: ?DraggableId = props.draggableId;
      // Number.isInteger will be provided by @babel/runtime-corejs2
      invariant(id, 'Draggable requires a draggableId');

      invariant(
        Number.isInteger(props.index),
        `${prefix(id)} requires an integer index prop`,
      );

      if (props.mapped.type !== 'DRAGGING') {
        // Checking provided ref (only when not dragging as it might be removed)
        checkIsValidInnerRef(getRef());

        // Checking that drag handle is provided
        invariant(
          findDragHandle(contextId, id),
          `${prefix(id)} Unable to find drag handle`,
        );
      }
    }
  });
}

// we expect isClone not to change for entire component's life
export function useClonePropValidation(isClone: boolean) {
  const initialRef = useRef<boolean>(isClone);

  useEffect(() => {
    if (isClone !== initialRef.current) {
      warning('Draggable isClone prop value changed during component life');
    }
  }, [isClone]);
}
