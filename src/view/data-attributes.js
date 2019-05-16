// @flow
export const prefix: string = 'data-rbd';
export const dragHandle = (() => {
  const base = `${prefix}-drag-handle`;

  return {
    base,
    draggableId: `${base}-draggable-id`,
    contextId: `${base}-context-id`,
  };
})();

export const draggable = (() => {
  const base: string = `${prefix}-draggable`;
  return {
    base,
    contextId: `${base}-context-id`,
    id: `${base}-id`,
    options: `${base}-options`,
  };
})();

export const droppable = {
  contextId: `${prefix}-droppable-context-id`,
};
export const placeholder = {
  contextId: `${prefix}-placeholder-context-id`,
};
