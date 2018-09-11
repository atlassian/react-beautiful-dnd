// @flow
import type {
  DraggableId,
  DragStart,
  DragUpdate,
  DropResult,
  DraggableLocation,
  Combine,
} from '../../../types';

export type MessagePreset = {|
  onDragStart: (start: DragStart) => string,
  onDragUpdate: (update: DragUpdate) => string,
  onDragEnd: (result: DropResult) => string,
|};

const position = (index: number): number => index + 1;

// We cannot list what index the Droppable is in automatically as we are not sure how
// the Droppable's have been configured
const onDragStart = (start: DragStart): string => `
  You have lifted an item in position ${position(start.source.index)}.
  Use the arrow keys to move, space bar to drop, and escape to cancel.
`;

const withLocation = (
  source: DraggableLocation,
  destination: DraggableLocation,
) => {
  const isInHomeList: boolean = source.droppableId === destination.droppableId;

  const startPosition: number = position(source.index);
  const endPosition: number = position(destination.index);

  if (isInHomeList) {
    return `
      You have moved the item from position ${startPosition}
      to position ${endPosition}
    `;
  }

  return `
    You have moved the item from position ${startPosition}
    in list ${source.droppableId}
    to list ${destination.droppableId}
    in position ${endPosition}
  `;
};

const withCombine = (
  id: DraggableId,
  source: DraggableLocation,
  combine: Combine,
): string => {
  const inHomeList: boolean = source.droppableId === combine.droppableId;

  if (inHomeList) {
    return `
      The item ${id}
      has been combined with ${combine.draggableId}`;
  }

  return `
      The item ${id}
      in list ${source.droppableId}
      has been combined with ${combine.draggableId}
      in list ${combine.droppableId}
    `;
};

const onDragUpdate = (update: DragUpdate): string => {
  const location: ?DraggableLocation = update.destination;
  if (location) {
    return withLocation(update.source, location);
  }

  const combine: ?Combine = update.combine;
  if (combine) {
    return withCombine(update.draggableId, update.source, combine);
  }

  return 'You are over an area that cannot be dropped on';
};

const returnedToStart = (source: DraggableLocation): string => `
  The item has returned to its starting position
  of ${position(source.index)}
`;

const onDragEnd = (result: DropResult): string => {
  if (result.reason === 'CANCEL') {
    return `
      Movement cancelled.
      ${returnedToStart(result.source)}
    `;
  }

  const location: ?DraggableLocation = result.destination;
  const combine: ?Combine = result.combine;

  if (location) {
    return `
      You have dropped the item.
      ${withLocation(result.source, location)}
    `;
  }

  if (combine) {
    return `
      You have dropped the item.
      ${withCombine(result.draggableId, result.source, combine)}
    `;
  }

  return `
    The item has been dropped while not over a drop area.
    ${returnedToStart(result.source)}
  `;
};

const preset: MessagePreset = {
  onDragStart,
  onDragUpdate,
  onDragEnd,
};

export default preset;
