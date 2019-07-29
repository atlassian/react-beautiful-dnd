// @flow
import type { DraggableId, ContextId } from '../../types';
import * as attributes from '../data-attributes';
import { find, toArray } from '../../native-with-fallback';
import { warning } from '../../dev-warning';
import isHtmlElement from '../is-type-of-element/is-html-element';

export default function tryGetDraggable(
  contextId: ContextId,
  draggableId: DraggableId,
): ?HTMLElement {
  // cannot create a selector with the draggable id as it might not be a valid attribute selector
  const selector: string = `[${attributes.draggable.contextId}="${contextId}"]`;
  const possible: Element[] = toArray(document.querySelectorAll(selector));

  const draggable: ?Element = find(possible, (el: Element): boolean => {
    return el.getAttribute(attributes.draggable.id) === draggableId;
  });

  if (!draggable) {
    return null;
  }

  if (!isHtmlElement(draggable)) {
    warning('Draggable element is not a HTMLElement');
    return null;
  }

  return draggable;
}
