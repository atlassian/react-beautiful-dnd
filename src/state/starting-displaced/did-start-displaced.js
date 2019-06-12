// @flow
import type { DraggableId, LiftEffect } from '../../types';

export default (
  draggableId: DraggableId,
  displacedByLift: LiftEffect,
): boolean => Boolean(displacedByLift.effected[draggableId]);
