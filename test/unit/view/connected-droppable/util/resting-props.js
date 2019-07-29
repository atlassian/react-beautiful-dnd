// @flow
import type { MapProps } from '../../../../../src/view/droppable/droppable-types';

const restingProps: MapProps = {
  placeholder: null,
  shouldAnimatePlaceholder: true,
  snapshot: {
    isDraggingOver: false,
    draggingOverWith: null,
    draggingFromThisWith: null,
  },
  useClone: null,
};

export default restingProps;
