// @flow
import invariant from 'tiny-invariant';
import { dragHandle } from '../data-attributes';
import type { DraggableId } from '../../types';

function isInContext(contextId, el: Element): boolean {
  return el.getAttribute(dragHandle) === contextId;
}

function isDragHandle(el: Element): boolean {
  return el.hasAttribute(dragHandle);
}

function getDraggableId(handle: Element): DraggableId {
  const id: ?DraggableId = handle.getAttribute(`${dragHandle}-id`);
  invariant(id, 'expected element to be a drag handle');
  return id;
}

export default function getClosestDragHandle(
  contextId: string,
  el: ?Element,
): ?DraggableId {
  if (el == null) {
    return null;
  }

  // not a drag handle or not in the right context
  if (!isDragHandle(el) || !isInContext(contextId, el)) {
    return getClosestDragHandle(contextId, el.parentElement);
  }

  return getDraggableId(el);
}
