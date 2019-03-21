// @flow
import type { MapProps } from '../../../../../src/view/droppable/droppable-types';

const restingProps: MapProps = {
  isDraggingOver: false,
  draggingOverWith: null,
  draggingFromThisWith: null,
  placeholder: null,
  shouldAnimatePlaceholder: true,
  snapshot: {
    isDraggingOver: false,
    draggingOverWith: null,
    draggingFromThisWith: null,
  },
};

export default restingProps;
