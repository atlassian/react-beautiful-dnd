// @flow
import type { ContextId, DraggableId } from '../../types';
import * as attributes from '../data-attributes';
import findClosestDragHandleFromEvent from './find-closest-drag-handle-from-event';

export default function tryGetClosestDraggableIdFromEvent(
  contextId: ContextId,
  event: Event,
): ?DraggableId {
  const handle: ?HTMLElement = findClosestDragHandleFromEvent(contextId, event);

  if (!handle) {
    return null;
  }

  return handle.getAttribute(attributes.dragHandle.draggableId);
}
