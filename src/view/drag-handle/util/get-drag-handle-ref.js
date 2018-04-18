// @flow
import invariant from 'tiny-invariant';
import { dragHandle } from '../../data-attributes';

const selector: string = `[${dragHandle}]`;

const getDragHandleRef = (draggableRef: HTMLElement): HTMLElement => {
  if (draggableRef.hasAttribute(dragHandle)) {
    return draggableRef;
  }

  // find the first nested drag handle
  // querySelector will return the first match on a breadth first search which is what we want
  // https://codepen.io/alexreardon/pen/erOqyZ
  const el: ?HTMLElement = draggableRef.querySelector(selector);

  invariant(el, 'Could not find draggable ref');

  return el;
};

export default getDragHandleRef;
