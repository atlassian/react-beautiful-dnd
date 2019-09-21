// @flow
import type { DraggableId, LiftEffect } from '../types';

export default function didStartAfterCritical(
  draggableId: DraggableId,
  afterCritical: LiftEffect,
): boolean {
  return Boolean(afterCritical.effected[draggableId]);
}
