// @flow
import type { DroppableDimension } from '../../../../../src/types';
import type { OwnProps } from '../../../../../src/view/droppable/droppable-types';
import getBodyElement from '../../../../../src/view/get-body-element';

export default (dimension: DroppableDimension): OwnProps => ({
  droppableId: dimension.descriptor.id,
  type: dimension.descriptor.type,
  isDropDisabled: false,
  isCombineEnabled: true,
  direction: dimension.axis.direction,
  ignoreContainerClipping: false,
  children: () => null,
  getContainerForClone: getBodyElement,
  mode: 'STANDARD',
  whenDraggingClone: null,
});
