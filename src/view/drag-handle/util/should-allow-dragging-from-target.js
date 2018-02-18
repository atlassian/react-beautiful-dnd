// @flow
import type { Props } from '../drag-handle-types';

export type TagNameMap = {
  [tagName: string]: true
}

export const interactiveTagNames: TagNameMap = {
  input: true,
  button: true,
  textarea: true,
  select: true,
  option: true,
  optgroup: true,
  video: true,
  audio: true,
};

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

  const isTargetInteractive: boolean = Boolean(interactiveTagNames[target.tagName.toLowerCase()]);

  if (isTargetInteractive) {
    return false;
  }

  // Need to see if any element between event.target and event.currentTarget (inclusive)
  // is contenteditable. A contenteditable element can contain other elements
  // - event.currentTarget = the drag handle
  // - event.target = the node that was interacted with (can be a child of the drag handle)

  return !isContentEditable(currentTarget, target);
};

