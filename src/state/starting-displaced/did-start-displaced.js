// @flow
import type { DraggableId, LiftEffect } from '../../types';

export default (draggableId: DraggableId, afterCritical: LiftEffect): boolean =>
  Boolean(afterCritical.effected[draggableId]);
