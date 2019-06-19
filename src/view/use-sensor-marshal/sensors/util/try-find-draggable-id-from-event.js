// @flow
import type { ContextId, DraggableId } from '../../../../types';
import * as attributes from '../../../data-attributes';
import closest from '../../closest';
import isHtmlElement from '../../../is-type-of-element/is-html-element';
import { warning } from '../../../../dev-warning';

function getSelector(contextId: ContextId): string {
  return `[${attributes.dragHandle.contextId}="${contextId}"]`;
}

export default function tryFindDraggableIdFromEvent(
  contextId: ContextId,
  event: Event,
): ?DraggableId {
  const selector: string = getSelector(contextId);

  const target: ?EventTarget = event.target;

  if (!isHtmlElement(target)) {
    warning('drag handle must be a HTMLElement');
    return null;
  }

  const handle: ?Element = closest(target, selector);

  if (!handle) {
    return null;
  }

  return handle.getAttribute(attributes.dragHandle.draggableId);
}
