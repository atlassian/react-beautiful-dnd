// @flow
import { useEffect } from 'react';
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
  invariant(
    typeof props.isDragDisabled === 'boolean',
    'isDragDisabled must be a boolean',
  );
}

function checkForOutdatedProps(props: Props) {
  if (Object.prototype.hasOwnProperty.call(props, 'shouldRespectForceTouch')) {
    warning(
      'shouldRespectForceTouch has been renamed to shouldRespectForcePress',
    );
  }
}

export default function useValidation(
  props: Props,
  getRef: () => ?HTMLElement,
) {
  // running after every update in development
  useEffect(() => {
    // wrapping entire block for better minification
    if (process.env.NODE_ENV !== 'production') {
      checkOwnProps(props);
      checkForOutdatedProps(props);

      // TODO: run check when virtual?
      if (props.mapped.type !== 'DRAGGING') {
        checkIsValidInnerRef(getRef());
      }
    }
  });
}
