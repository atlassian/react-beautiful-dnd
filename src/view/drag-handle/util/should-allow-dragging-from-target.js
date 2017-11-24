// @flow
import type { Props } from '../drag-handle-types';

export const interactiveTagNames: string[] = [
  'input',
  'textarea',
  'select',
  'option',
  'button',
];

const isContentEditable = (parent: HTMLElement, current: ?HTMLElement): boolean => {
  if (current == null) {
    return false;
  }

  if (current.getAttribute('contenteditable') === 'true') {
    return true;
  }

  // nothing more can be done and no results found
  if (current === parent) {
    return false;
  }

  // recursion to check parent
  return isContentEditable(parent, current.parentElement);
};

export default (event: Event, props: Props): boolean => {
  // Allowing drag with all element types
  if (props.canDragInteractiveElements) {
    return true;
  }

  const isTargetInteractive: boolean =
    interactiveTagNames.indexOf(event.target.tagName.toLowerCase()) !== -1;

  if (isTargetInteractive) {
    return false;
  }

  // Need to see if any element between event.target and event.currentTarget (inclusive)
  // is contenteditable. A contenteditable element can contain other elements
  // - event.currentTarget = the drag handle
  // - event.target = the node that was interacted with (can be a child of the drag handle)

  return !isContentEditable(event.currentTarget, event.target);
};

