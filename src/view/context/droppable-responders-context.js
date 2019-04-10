// @flow
import React from 'react';
import type { Responders, DroppableId } from '../../types';

export type DroppableRespondersContextValue = {|
  register: (id: DroppableId, getResponders: () => Responders) => void,
  unregister: (id: DroppableId) => void,
|};

export default React.createContext<?DroppableRespondersContextValue>(null);
