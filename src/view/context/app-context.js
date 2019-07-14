// @flow
import React from 'react';
import type { DraggableId, ContextId, ElementId } from '../../types';
import type { DimensionMarshal } from '../../state/dimension-marshal/dimension-marshal-types';
import type { FocusMarshal } from '../use-focus-marshal/focus-marshal-types';
import type { Registry } from '../../state/registry/registry-types';

export type AppContextValue = {|
  marshal: DimensionMarshal,
  focus: FocusMarshal,
  contextId: ContextId,
  canLift: (id: DraggableId) => boolean,
  isMovementAllowed: () => boolean,
  liftInstructionId: ElementId,
  registry: Registry,
|};

export default React.createContext<?AppContextValue>(null);
