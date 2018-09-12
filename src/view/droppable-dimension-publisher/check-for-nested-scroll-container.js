// @flow
import getClosestScrollable from './get-closest-scrollable';

// We currently do not support nested scroll containers
// But will hopefully support this soon!
export default (scrollable: ?Element) => {
  if (process.env.NODE_ENV === 'production') {
    return;
  }

  if (!scrollable) {
    return;
  }

  const anotherScrollParent: ?Element = getClosestScrollable(
    scrollable.parentElement,
  );

  if (!anotherScrollParent) {
    return;
  }

  console.warn(`
    Droppable: unsupported nested scroll container detected.
    A Droppable can only have one scroll parent (which can be itself)
    Nested scroll containers are currently not supported.

    We hope to support nested scroll containers soon: https://github.com/atlassian/react-beautiful-dnd/issues/131
  `);
};
