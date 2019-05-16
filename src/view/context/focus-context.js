// @flow
import React from 'react';
import type { DraggableId } from '../../types';

type FocusAPI = {|
  unregister: () => void,
  onFocus: () => void,
  onBlur: () => void,
|};

export type FocusContextValue = {|
  register: (id: DraggableId, focus: () => void) => FocusAPI,
|};

export default React.createContext<?FocusContextValue>(null);
