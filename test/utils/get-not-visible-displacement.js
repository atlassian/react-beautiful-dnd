// @flow
import type { DraggableDimension, Displacement } from '../../src/types';

export default (draggable: DraggableDimension): Displacement => ({
  draggableId: draggable.descriptor.id,
  isVisible: false,
  shouldAnimate: false,
});
