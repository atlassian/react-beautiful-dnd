// @flow
import { useEffect } from 'react';
import invariant from 'tiny-invariant';
import type { Props } from './draggable-types';
import checkIsValidInnerRef from '../check-is-valid-inner-ref';

function checkOwnProps(props: Props) {
  // Number.isInteger will be provided by @babel/runtime-corejs2
  invariant(
    Number.isInteger(props.index),
    'Draggable requires an integer index prop',
  );
  invariant(props.draggableId, 'Draggable requires a draggableId');
  invariant(
    typeof props.isDragDisabled === 'boolean',
    'isDragDisabled must be a boolean',
  );
}

export default function useValidation(
  props: Props,
  getRef: () => ?HTMLElement,
) {
  // running after every update in development
  useEffect(() => {
    if (process.env.NODE_ENV === 'production') {
      return;
    }
    checkOwnProps(props);
    checkIsValidInnerRef(getRef());
  });
}
