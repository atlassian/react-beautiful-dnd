// @flow
import type { DraggableId, OnLift } from '../../types';

export default (draggableId: DraggableId, onLift: OnLift): boolean =>
  Boolean(onLift.wasDisplaced[draggableId]);
