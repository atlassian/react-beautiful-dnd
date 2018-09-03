// @flow
import inHomeList from './in-home-list';
import inForeignList from './in-foreign-list';
import type { Args, Result } from './move-to-next-index-types';
import type { DraggableDimension } from '../../../../types';

export default (args: Args): ?Result => {
  const { draggableId, draggables, droppable } = args;

  const draggable: DraggableDimension = draggables[draggableId];
  const isInHomeList: boolean =
    draggable.descriptor.droppableId === droppable.descriptor.id;

  // Cannot move in list if the list is not enabled (can still cross axis move)
  if (!droppable.isEnabled) {
    return null;
  }

  if (isInHomeList) {
    return inHomeList(args);
  }

  return inForeignList(args);
};
