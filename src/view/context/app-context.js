// @flow
import React from 'react';
import type { DraggableId } from '../../types';
import type { DimensionMarshal } from '../../state/dimension-marshal/dimension-marshal-types';
import type { DroppableResponderRegistration } from '../use-droppable-responders/droppable-responders-types';

export type AppContextValue = {|
  marshal: DimensionMarshal,
  style: string,
  canLift: (id: DraggableId) => boolean,
  isMovementAllowed: () => boolean,
  droppableResponderRegistration: DroppableResponderRegistration,
|};

export default React.createContext<?AppContextValue>(null);
