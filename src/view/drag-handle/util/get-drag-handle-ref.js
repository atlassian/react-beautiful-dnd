// @flow
import invariant from 'tiny-invariant';
import { dragHandle } from '../../data-attributes';

const selector: string = `[${dragHandle}]`;

const isSVG = (el: mixed) => {
  // Some test runners are not aware of the SVGElement constructor
  // We opt out of this check for those environments
  // $FlowFixMe - flow does not know about SVGElement
  if (typeof SVGElement === 'undefined') {
    return false;
  }

  return el instanceof SVGElement;
};

const throwIfSVG = (el: mixed) => {
  invariant(
    !isSVG(el),
    `A drag handle cannot be an SVGElement: it has inconsistent focus support.

    More information: https://github.com/atlassian/react-beautiful-dnd/blob/master/docs/guides/dragging-svgs.md`,
  );
};

// If called when the component is disabled then the data
// attribute will not be present
const getDragHandleRef = (draggableRef: HTMLElement): HTMLElement => {
  if (draggableRef.hasAttribute(dragHandle)) {
    throwIfSVG(draggableRef);
    return draggableRef;
  }

  // find the first nested drag handle
  // querySelector will return the first match on a breadth first search which is what we want
  // Search will fail when the drag handle is disabled
  // https://codepen.io/alexreardon/pen/erOqyZ
  const el: ?HTMLElement = draggableRef.querySelector(selector);

  throwIfSVG(draggableRef);

  invariant(
    el,
    `
      Cannot find drag handle element inside of Draggable.
      Please be sure to apply the {...provided.dragHandleProps} to your Draggable

      More information: https://github.com/atlassian/react-beautiful-dnd#draggable
    `,
  );

  invariant(el instanceof HTMLElement, 'A drag handle must be a HTMLElement');

  return el;
};

export default getDragHandleRef;
