// @flow
import type { MapProps } from '../../../../../src/view/droppable/droppable-types';

const restingProps: MapProps = {
  placeholder: null,
  shouldAnimatePlaceholder: false,
  snapshot: {
    isDraggingOver: false,
    draggingOverWith: null,
    draggingFromThisWith: null,
    isUsingPlaceholder: false,
  },
  useClone: null,
};

export default restingProps;
