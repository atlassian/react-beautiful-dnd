// @flow
const prefix = (key: string): string => `private-react-beautiful-dnd-key-do-not-use-${key}`;

export const storeKey: string = prefix('store');
export const droppableIdKey: string = prefix('droppable-id');
export const dimensionMarshalKey: string = prefix('dimension-marshal');
export const draggableClassNameKey: string = prefix('draggable-class-name');
