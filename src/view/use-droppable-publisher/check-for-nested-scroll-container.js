// @flow
import getClosestScrollable from './get-closest-scrollable';
import { warning } from '../../dev-warning';

// We currently do not support nested scroll containers
// But will hopefully support this soon!
export default (scrollable: ?Element) => {
  if (!scrollable) {
    return;
  }

  const anotherScrollParent: ?Element = getClosestScrollable(
    scrollable.parentElement,
  );

  if (!anotherScrollParent) {
    return;
  }

  warning(`
    Droppable: unsupported nested scroll container detected.
    A Droppable can only have one scroll parent (which can be itself)
    Nested scroll containers are currently not supported.

    We hope to support nested scroll containers soon: https://github.com/atlassian/react-beautiful-dnd/issues/131
  `);
};
