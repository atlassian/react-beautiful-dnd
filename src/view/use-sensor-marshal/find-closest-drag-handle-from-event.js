// @flow
import type { ContextId } from '../../types';
import * as attributes from '../data-attributes';
import closest from './closest';
import isElement from '../is-type-of-element/is-element';
import { warning } from '../../dev-warning';
import isHtmlElement from '../is-type-of-element/is-html-element';

function getSelector(contextId: ContextId): string {
  return `[${attributes.dragHandle.contextId}="${contextId}"]`;
}

export default function findClosestDragHandleFromEvent(
  contextId: ContextId,
  event: Event,
): ?HTMLElement {
  const target: ?EventTarget = event.target;

  if (!isElement(target)) {
    warning('event.target must be a Element');
    return null;
  }

  const selector: string = getSelector(contextId);
  const handle: ?Element = closest(target, selector);

  if (!handle) {
    return null;
  }

  if (!isHtmlElement(handle)) {
    warning('drag handle must be a HTMLElement');
    return null;
  }

  return handle;
}
