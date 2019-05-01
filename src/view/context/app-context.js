// @flow
import React from 'react';
import type { DraggableId } from '../../types';
import type { DimensionMarshal } from '../../state/dimension-marshal/dimension-marshal-types';

export type AppContextValue = {|
  marshal: DimensionMarshal,
  contextId: string,
  canLift: (id: DraggableId) => boolean,
  isMovementAllowed: () => boolean,
|};

export default React.createContext<?AppContextValue>(null);
