// @flow
import type { DraggableId, ContextId } from '../../types';
import * as attributes from '../data-attributes';
import { toArray, find } from '../../native-with-fallback';

export default function tryGetDraggable(
  contextId: ContextId,
  draggableId: DraggableId,
): ?HTMLElement {
  // cannot create a selector with the draggable id as it might not be a valid attribute selector
  const selector: string = `[${attributes.draggable.contextId}="${contextId}"]`;
  const possible: HTMLElement[] = toArray(document.querySelectorAll(selector));

  const draggable: ?HTMLElement = find(possible, (el: HTMLElement): boolean => {
    return el.getAttribute(attributes.draggable.id) === draggableId;
  });

  return draggable || null;
}
