// @flow
import type {
  StateSnapshot,
  DropAnimation,
} from '../../../../../src/view/draggable/draggable-types';
import type {
  MovementMode,
  DroppableId,
  DraggableId,
} from '../../../../../src/types';

type GetDraggingSnapshotArgs = {|
  mode: MovementMode,
  draggingOver: ?DroppableId,
  combineWith: ?DraggableId,
  dropping: ?DropAnimation,
|};

export const getDraggingSnapshot = ({
  mode,
  draggingOver,
  combineWith,
  dropping,
}: GetDraggingSnapshotArgs): StateSnapshot => ({
  isDragging: true,
  isDropAnimating: Boolean(dropping),
  dropAnimation: dropping,
  mode,
  draggingOver,
  combineWith,
  combineTargetFor: null,
});

type GetSecondarySnapshotArgs = {|
  combineTargetFor: ?DraggableId,
|};

export const getSecondarySnapshot = ({
  combineTargetFor,
}: GetSecondarySnapshotArgs): StateSnapshot => ({
  isDragging: false,
  isDropAnimating: false,
  dropAnimation: null,
  mode: null,
  draggingOver: null,
  combineTargetFor,
  combineWith: null,
});
