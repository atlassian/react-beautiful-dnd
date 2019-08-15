// @flow
import type { OwnProps } from '../../../../../src/view/draggable/draggable-types';
import type { DraggableDimension } from '../../../../../src/types';

export default (dimension: DraggableDimension): OwnProps => ({
  // Public own props
  draggableId: dimension.descriptor.id,
  index: dimension.descriptor.index,
  children: () => null,

  // Private own props
  isClone: false,
  isEnabled: true,
  canDragInteractiveElements: false,
  shouldRespectForcePress: true,

  // Own props
  descriptor: dimension.descriptor,
});
