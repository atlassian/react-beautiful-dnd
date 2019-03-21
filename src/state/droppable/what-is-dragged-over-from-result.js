// @flow
import type { DroppableId, DropResult } from '../../types';

export default (result: DropResult): ?DroppableId => {
  const { combine, destination } = result;

  if (destination) {
    return destination.droppableId;
  }

  if (combine) {
    return combine.droppableId;
  }

  return null;
};
