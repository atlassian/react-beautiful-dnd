// @flow
import inHomeList from './in-home-list';
import inForeignList from './in-foreign-list';
import type { Args, Result } from './jump-to-next-index-types';
import type { DraggableDimension } from '../../types';

export default (args: Args): ?Result => {
  const { draggableId, draggables, droppable } = args;

  const draggable: DraggableDimension = draggables[draggableId];
  const isInHomeList: boolean = draggable.droppableId === droppable.id;

  if (isInHomeList) {
    return inHomeList(args);
  }

  return inForeignList(args);
};
