// @flow
import { useRef, useEffect } from 'react';
import invariant from 'tiny-invariant';
import type { Props } from './draggable-types';
import checkIsValidInnerRef from '../check-is-valid-inner-ref';
import { warning } from '../../dev-warning';

function checkOwnProps(props: Props) {
  // Number.isInteger will be provided by @babel/runtime-corejs2
  invariant(
    Number.isInteger(props.index),
    'Draggable requires an integer index prop',
  );
  invariant(props.draggableId, 'Draggable requires a draggableId');
}
export function useValidation(props: Props, getRef: () => ?HTMLElement) {
  // running after every update in development
  useEffect(() => {
    // wrapping entire block for better minification
    if (process.env.NODE_ENV !== 'production') {
      checkOwnProps(props);

      // TODO: run check when virtual?
      if (props.mapped.type !== 'DRAGGING') {
        checkIsValidInnerRef(getRef());
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
