// @flow
import type { DraggableId, ContextId } from '../../types';
import { dragHandle as dragHandleAttr } from '../data-attributes';
import { warning } from '../../dev-warning';
import { find, toArray } from '../../native-with-fallback';
import isHtmlElement from '../is-type-of-element/is-html-element';

export default function findDragHandle(
  contextId: ContextId,
  draggableId: DraggableId,
): ?HTMLElement {
  // cannot create a selector with the draggable id as it might not be a valid attribute selector
  const selector: string = `[${dragHandleAttr.contextId}="${contextId}"]`;
  const possible: Element[] = toArray(document.querySelectorAll(selector));

  if (!possible.length) {
    warning(`Unable to find any drag handles in the context "${contextId}"`);
    return null;
  }

  const handle: ?Element = find(possible, (el: Element): boolean => {
    return el.getAttribute(dragHandleAttr.draggableId) === draggableId;
  });

  if (!handle) {
    warning(
      `Unable to find drag handle with id "${draggableId}" as no handle with a matching id was found`,
    );
    return null;
  }

  if (!isHtmlElement(handle)) {
    warning('drag handle needs to be a HTMLElement');
    return null;
  }

  return handle;
}
