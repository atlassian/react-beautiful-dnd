// @flow
import type { DroppableId, Responders } from '../../types';

export type DroppableResponderRegistration = {|
  register: (id: DroppableId, getResponders: () => Responders) => void,
  unregister: (id: DroppableId) => void,
|};
