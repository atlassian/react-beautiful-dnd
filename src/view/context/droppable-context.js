// @flow
import React from 'react';
import type { DroppableId, TypeId } from '../../types';

export type DroppableContextValue = {|
  droppableId: DroppableId,
  type: TypeId,
|};

export default React.createContext<?DroppableContextValue>(null);
