// @flow
const prefix = (key: string): string => `private-drag-drop-key-do-not-use-store-${key}`;

export const storeKey: string = prefix('store');
export const droppableIdKey: string = prefix('droppable-id');
export const dimensionMarshalKey: string = prefix('dimension-marshal');
