// @flow
import invariant from 'tiny-invariant';
import type { ContextId } from '../../types';
import * as attributes from '../data-attributes';
import closest from './closest';
import isHtmlElement from '../is-type-of-element/is-html-element';

export function getClosestDragHandle(
  contextId: string,
  el: Element,
): ?HTMLElement {
  const attribute: string = attributes.dragHandle.contextId;
  const selector: string = `[${attribute}="${contextId}"]`;
  const handle: ?Element = closest(el, selector);

  return handle && isHtmlElement(handle) ? handle : null;
}

export function getClosestDraggable(
  contextId: ContextId,
  handle: Element,
): HTMLElement {
  // TODO: id might not make a good selector if it has strange characters in it - such as whitespace
  // const selector: string = `[${contextIdAttr}="${contextId}"] [${idAttr}="${id}"]`;
  const selector: string = `[${attributes.draggable.contextId}="${contextId}"]`;

  const draggable: ?Element = closest(handle, selector);
  invariant(draggable, 'expected drag handle to have draggable');
  invariant(isHtmlElement(draggable), 'expected draggable to be a HTMLElement');

  return draggable;
}
