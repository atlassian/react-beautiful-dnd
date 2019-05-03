// @flow
import invariant from 'tiny-invariant';
import type { ContextId } from '../../types';
import * as attributes from '../data-attributes';
import closest from './closest';

export function getClosestDragHandle(contextId: string, el: Element): ?Element {
  const attribute: string = attributes.dragHandle.contextId;
  const selector: string = `[${attribute}="${contextId}"]`;
  const handle: ?Element = closest(el, selector);

  return handle || null;
}

export function getClosestDraggable(
  contextId: ContextId,
  handle: Element,
): Element {
  // TODO: id might not make a good selector if it has strange characters in it - such as whitespace
  // const selector: string = `[${contextIdAttr}="${contextId}"] [${idAttr}="${id}"]`;
  const selector: string = `[${attributes.draggable.contextId}="${contextId}"]`;

  const draggable: ?Element = closest(handle, selector);
  invariant(draggable, 'expected drag handle to have draggable');

  return draggable;
}
