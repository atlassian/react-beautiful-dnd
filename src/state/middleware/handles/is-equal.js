// @flow
import type { Critical, DraggableLocation, Combine } from '../../../types';

export const areLocationsEqual = (
  first: ?DraggableLocation,
  second: ?DraggableLocation,
): boolean => {
  // if both are null - we are equal
  if (first == null && second == null) {
    return true;
  }

  // if one is null - then they are not equal
  if (first == null || second == null) {
    return false;
  }

  // compare their actual values
  return (
    first.droppableId === second.droppableId && first.index === second.index
  );
};

export const isCombineEqual = (first: ?Combine, second: ?Combine): boolean => {
  // if both are null - we are equal
  if (first == null && second == null) {
    return true;
  }

  // only one is null
  if (first == null || second == null) {
    return false;
  }

  return (
    first.draggableId === second.draggableId &&
    first.droppableId === second.droppableId
  );
};

export const isCriticalEqual = (first: Critical, second: Critical): boolean => {
  if (first === second) {
    return true;
  }

  const isDraggableEqual: boolean =
    first.draggable.id === second.draggable.id &&
    first.draggable.droppableId === second.draggable.droppableId &&
    first.draggable.type === second.draggable.type &&
    first.draggable.index === second.draggable.index;

  const isDroppableEqual: boolean =
    first.droppable.id === second.droppable.id &&
    first.droppable.type === second.droppable.type;

  return isDraggableEqual && isDroppableEqual;
};
