// @flow
import type {
  DragStart,
  DragUpdate,
  DropResult,
} from '../../types';

export type MessagePreset = {|
  onDragStart: (start: DragStart) => string,
  onDragUpdate: (update: DragUpdate) => string,
  onDragEnd: (result: DropResult) => string,
|}

// We cannot list what index the Droppable is in automatically as we are not sure how
// the Droppable's have been configured
const onDragStart = (start: DragStart): string => `
  You have lifted an item in position ${start.source.index + 1}.
  Use the arrow keys to move, space bar to drop, and escape to cancel.
`;

const onDragUpdate = (update: DragUpdate): string => {
  if (!update.destination) {
    return 'You are currently not dragging over a droppable area';
  }

  // Moving in the same list
  if (update.source.droppableId === update.destination.droppableId) {
    return `You have moved the item to position ${update.destination.index + 1}`;
  }

  // Moving into a new list

  return `
    You have moved the item from list ${update.source.droppableId} in position ${update.source.index + 1}
    to list ${update.destination.droppableId} in position ${update.destination.index + 1}
  `;
};

const onDragEnd = (result: DropResult): string => {
  if (result.reason === 'CANCEL') {
    return `
      Movement cancelled.
      The item has returned to its starting position of ${result.source.index + 1}
    `;
  }

  // Not moved anywhere (such as when dropped over no list)
  if (!result.destination) {
    return `
      The item has been dropped while not over a droppable location.
      The item has returned to its starting position of ${result.source.index + 1}
    `;
  }

  // Dropped in home list
  if (result.source.droppableId === result.destination.droppableId) {
    // It is in the position that it started in
    if (result.source.index === result.destination.index) {
      return `
        You have dropped the item.
        It has been dropped on its starting position of ${result.source.index + 1}
      `;
    }

    // It is in a new position
    return `
      You have dropped the item.
      It has moved from position ${result.source.index + 1} to ${result.destination.index + 1}
    `;
  }

  // Dropped in a new list
  return `
    You have dropped the item.
    It has moved from position ${result.source.index + 1} in list ${result.source.droppableId}
    to position ${result.destination.index + 1} in list ${result.destination.droppableId}
  `;
};

const preset: MessagePreset = {
  onDragStart, onDragUpdate, onDragEnd,
};

export default preset;
