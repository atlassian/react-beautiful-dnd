// @flow
import { find, toArray } from '../../native-with-fallback';
import type { PredicateFn } from '../../native-with-fallback';

// declaring composedPath manually, seems it is not defined on Event yet
type EventWithComposedPath = Event & {
  composedPath?: () => HTMLElement[],
};

export function getEventTarget(event: EventWithComposedPath): ?EventTarget {
  const target = event.composedPath && event.composedPath()[0];
  return target || event.target;
}

export function getEventTargetRoot(event: ?EventWithComposedPath): Node {
  const source = event && event.composedPath && event.composedPath()[0];
  const root = source && source.getRootNode();
  return root || document;
}

export function queryElements(
  ref: ?Node,
  selector: string,
  filterFn: PredicateFn<Element>,
): ?Element {
  const rootNode: any = ref && ref.getRootNode();
  const documentOrShadowRoot: ShadowRoot | Document =
    rootNode && rootNode.querySelectorAll ? rootNode : document;
  const possible = toArray(documentOrShadowRoot.querySelectorAll(selector));
  const filtered = find(possible, filterFn);

  // in case nothing was found in this document/shadowRoot we recursievly try the parent document(Fragment) given
  // by the host property. This is needed in case the the draggable/droppable itself contains a shadow root
  if (!filtered && documentOrShadowRoot.host) {
    return queryElements(
      ((documentOrShadowRoot: any).host: ShadowRoot),
      selector,
      filterFn,
    );
  }
  return filtered;
}
