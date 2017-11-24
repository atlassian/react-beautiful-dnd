// @flow
import type { Props } from '../drag-handle-types';

export const interactiveTagNames: string[] = [
  'input',
  'button',
  'textarea',
  'select',
  'option',
  'optgroup',
  'video',
  'audio',
];

const isContentEditable = (parent: Element, current: ?Element): boolean => {
  if (current == null) {
    return false;
  }

  // contenteditable="true" or contenteditable="" are valid ways
  // of creating a contenteditable container
  // https://developer.mozilla.org/en-US/docs/Web/HTML/Global_attributes/contenteditable

  const attribute: ?string = current.getAttribute('contenteditable');
  if (attribute === 'true' || attribute === '') {
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

  const { target, currentTarget } = event;

  // Technically target and currentTarget are EventTarget's and do not have to be elements
  if (!(target instanceof HTMLElement) || !(currentTarget instanceof HTMLElement)) {
    return true;
  }

  const isTargetInteractive: boolean =
    interactiveTagNames.indexOf(target.tagName.toLowerCase()) !== -1;

  if (isTargetInteractive) {
    return false;
  }

  // Need to see if any element between event.target and event.currentTarget (inclusive)
  // is contenteditable. A contenteditable element can contain other elements
  // - event.currentTarget = the drag handle
  // - event.target = the node that was interacted with (can be a child of the drag handle)

  return !isContentEditable(currentTarget, target);
};

