// @flow
import invariant from 'tiny-invariant';
import type { Props } from './droppable-types';

export default (props: Props) => {
  invariant(props.droppableId, 'A Droppable requires a droppableId prop');
  invariant(
    typeof props.isDropDisabled === 'boolean',
    'isDropDisabled must be a boolean',
  );
  invariant(
    typeof props.isCombineEnabled === 'boolean',
    'isCombineEnabled must be a boolean',
  );
  invariant(
    typeof props.ignoreContainerClipping === 'boolean',
    'ignoreContainerClipping must be a boolean',
  );
};
