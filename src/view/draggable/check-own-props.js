// @flow
import invariant from 'tiny-invariant';
import type { Props } from './draggable-types';

export default (props: Props) => {
  // Number.isInteger will be provided by @babel/runtime-corejs2
  invariant(
    Number.isInteger(props.index),
    'Draggable requires an integer index prop',
  );
  invariant(props.draggableId, 'Draggable requires a draggableId');
  invariant(props.isDragDisabled !== null, 'isDragDisabled cannot be null');
};
