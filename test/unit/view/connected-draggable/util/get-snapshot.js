// @flow
import type {
  StateSnapshot,
  DropAnimation,
} from '../../../../../src/view/draggable/draggable-types';
import type {
  MovementMode,
  DroppableId,
  DraggableId,
  DraggableDescriptor,
} from '../../../../../src/types';

type GetDraggingSnapshotArgs = {|
  descriptor: DraggableDescriptor,
  mode: MovementMode,
  draggingOver: ?DroppableId,
  combineWith: ?DraggableId,
  dropping: ?DropAnimation,
  isClone?: ?boolean,
|};

export const getDraggingSnapshot = ({
  descriptor,
  mode,
  draggingOver,
  combineWith,
  dropping,
  isClone,
}: GetDraggingSnapshotArgs): StateSnapshot => ({
  descriptor,
  isDragging: true,
  isDropAnimating: Boolean(dropping),
  dropAnimation: dropping,
  mode,
  draggingOver,
  combineWith,
  combineTargetFor: null,
  isClone: Boolean(isClone),
});

type GetSecondarySnapshotArgs = {|
  descriptor: DraggableDescriptor,
  combineTargetFor: ?DraggableId,
|};

export const getSecondarySnapshot = ({
  descriptor,
  combineTargetFor,
}: GetSecondarySnapshotArgs): StateSnapshot => ({
  descriptor,
  isDragging: false,
  isClone: false,
  isDropAnimating: false,
  dropAnimation: null,
  mode: null,
  draggingOver: null,
  combineTargetFor,
  combineWith: null,
});
