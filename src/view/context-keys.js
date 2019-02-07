// @flow
const prefix = (key: string): string =>
  `private-react-beautiful-dnd-key-do-not-use-${key}`;

export const storeKey: string = prefix('store');
export const droppableIdKey: string = prefix('droppable-id');
export const droppableTypeKey: string = prefix('droppable-type');
export const dimensionMarshalKey: string = prefix('dimension-marshal');
export const styleKey: string = prefix('style');
export const canLiftKey: string = prefix('can-lift');
export const isDraggingKey: string = prefix('is-dragging');
export const isDroppingKey: string = prefix('is-dropping');
