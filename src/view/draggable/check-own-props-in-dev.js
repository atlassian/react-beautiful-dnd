// @flow
import invariant from 'tiny-invariant';
import type { Props } from './draggable-types';

export default (props: Props) => {
  if (process.env.NODE_ENV === 'production') {
    return;
  }

  // IE11 does not support this check
  if (Number.isInteger) {
    invariant(
      Number.isInteger(props.index),
      'Draggable requires an integer index prop',
    );
  }

  invariant(props.draggableId, 'Draggable requires a draggableId');
};
