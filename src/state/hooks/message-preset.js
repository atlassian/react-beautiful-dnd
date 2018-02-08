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

const onDragStart = (start: DragStart): string => `
  You have lifted an item in position ${start.source.index + 1}.
  Use the arrow keys to move, space bar to drop, and escape to cancel.
`;

const onDragUpdate = (update: DragUpdate): string => {
  if (!update.destination) {
    return 'You are currently not dragging over any droppable area';
  }
  // TODO: list what droppable they are in?
  return `Item is now in position ${update.destination.index + 1}`;
};

const onDragEnd = (result: DropResult): string => {
  if (result.reason === 'CANCEL') {
    return `
      Movement cancelled.
      Item has been returned to its original position of ${result.source.index + 1}
    `;
  }

  if (!result.destination) {
    return `
      Item has been dropped while not over a location.
      Item has been returned to its original position of ${result.source.index + 1}
    `;
  }

  if (result.source.droppableId === result.destination.droppableId) {
    return `
      Item dropped.
      It has moved from position ${result.source.index + 1} to ${result.destination.index + 1}
  `;
  }

  return `
    Item dropped.
    It has moved from position ${result.source.index + 1} in list ${result.source.droppableId}
    to position ${result.destination.index + 1} in list ${result.destination.droppableId}
  `;
};

const preset: MessagePreset = {
  onDragStart, onDragUpdate, onDragEnd,
};

export default preset;
