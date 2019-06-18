// @flow
import type { ContextId, DraggableId } from '../../../../types';
import * as attributes from '../../../data-attributes';
import closest from '../../closest';

function getSelector(contextId: ContextId): string {
  return `[${attributes.dragHandle.contextId}="${contextId}"]`;
}

export default function tryFindDraggableIdFromEvent(
  contextId: ContextId,
  event: Event,
): ?DraggableId {
  const selector: string = getSelector(contextId);

  const target: ?EventTarget = event.target;

  if (!(target instanceof HTMLElement)) {
    return null;
  }

  const handle: ?Element = closest(target, selector);

  if (!handle) {
    return null;
  }

  return handle.getAttribute(attributes.dragHandle.draggableId);
}
