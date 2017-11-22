// @flow
import type { Props } from '../drag-handle-types';

const interactive: string[] = [
  'input',
  'textarea',
  'select',
  'option',
  'button',
  'contenteditable',
];

export default (event: Event, props: Props): boolean => {
  // Allowing drag with all element types
  if (props.canDragInteractiveElements) {
    return true;
  }

  // Blocking dragging with interactive elements

  // If tagname is not found in the interactive array then a drag is permitted

  // $ExpectError - .tagName is not a property of EventTarget apparently...
  return interactive.indexOf(event.target.tagName.toLowerCase()) === -1;
};

