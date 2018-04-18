// @flow
import { dragHandle } from '../data-attributes';

const selector: string = `[${dragHandle}]`;

const getDragHandleRef = (draggableRef: HTMLElement): ?HTMLElement => {
  if (draggableRef.hasAttribute(dragHandle)) {
    return draggableRef;
  }

  // find the first nested drag handle
  const el: ?HTMLElement = draggableRef.querySelector(selector);

  if (!el) {
    return null;
  }

  return el;
};

const focusOnDragHandle = (draggableRef: HTMLElement) => {
  const dragHandleRef: ?HTMLElement = getDragHandleRef(draggableRef);
  if (!dragHandleRef) {
    console.error('Draggable cannot focus on the drag handle as it cannot be found');
    return;
  }
  dragHandleRef.focus();
};

export default focusOnDragHandle;
