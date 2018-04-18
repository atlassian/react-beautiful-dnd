// @flow
import { dragHandle } from '../../data-attributes';

const selector: string = `[${dragHandle}]`;

const getDragHandleRef = (draggableRef: HTMLElement): ?HTMLElement => {
  if (draggableRef.hasAttribute(dragHandle)) {
    return draggableRef;
  }

  // find the first nested drag handle
  // querySelector will return the first match on a breadth first search which is what we want
  // https://codepen.io/alexreardon/pen/erOqyZ
  const el: ?HTMLElement = draggableRef.querySelector(selector);

  return el || null;
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
