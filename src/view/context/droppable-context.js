// @flow
import React from 'react';
import type { DroppableId, TypeId } from '../../types';

export type DroppableContextValue = {|
  usingCloneWhenDragging: boolean,
  droppableId: DroppableId,
  type: TypeId,
|};

export default React.createContext<?DroppableContextValue>(null);
