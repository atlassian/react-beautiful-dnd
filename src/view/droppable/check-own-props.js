// @flow
import invariant from 'tiny-invariant';
import type { Props } from './droppable-types';

export default (props: Props) => {
  invariant(props.droppableId, 'A Droppable requires a droppableId prop');
  invariant(props.isDropDisabled !== null, 'isDropDisabled cannot be null');
  invariant(props.isCombineEnabled !== null, 'isCombineEnabled cannot be null');
  invariant(
    props.ignoreContainerClipping !== null,
    'ignoreContainerClipping cannot be null',
  );
};
