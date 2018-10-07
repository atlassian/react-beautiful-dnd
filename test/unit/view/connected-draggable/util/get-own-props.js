// @flow
import type { OwnProps } from '../../../../../src/view/draggable/draggable-types';
import type { DraggableDimension } from '../../../../../src/types';

export default (dimension: DraggableDimension): OwnProps => ({
  draggableId: dimension.descriptor.id,
  index: dimension.descriptor.index,
  payload: dimension.descriptor.payload,
  isDragDisabled: false,
  disableInteractiveElementBlocking: false,
  children: () => null,
});
