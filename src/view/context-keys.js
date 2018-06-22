// @flow
const prefix = (key: string): string => `private-react-beautiful-dnd-key-do-not-use-${key}`;

export const storeKey: string = prefix('store');
export const droppableIdKey: string = prefix('droppable-id');
export const droppableTypeKey: string = prefix('droppable-type');
export const dimensionMarshalKey: string = prefix('dimension-marshal');
export const styleContextKey: string = prefix('style-context');
export const canLiftContextKey: string = prefix('can-lift');
