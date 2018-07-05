// @flow
import invariant from 'tiny-invariant';
import { dragHandle } from '../../data-attributes';

const selector: string = `[${dragHandle}]`;

// If called when the component is disabled then the data
// attribute will not be present
const getDragHandleRef = (draggableRef: HTMLElement): HTMLElement => {
  if (draggableRef.hasAttribute(dragHandle)) {
    return draggableRef;
  }

  // find the first nested drag handle
  // querySelector will return the first match on a breadth first search which is what we want
  // Search will fail when the drag handle is disabled
  // https://codepen.io/alexreardon/pen/erOqyZ
  const el: ?HTMLElement = draggableRef.querySelector(selector);

  invariant(
    el,
    `
      Cannot find drag handle element inside of Draggable.
      Please be sure to apply the {...provided.dragHandleProps} to your Draggable

      More information: https://github.com/atlassian/react-beautiful-dnd#draggable
    `,
  );

  // $FlowFixMe - no support for SVGElement
  if (el instanceof SVGElement) {
    invariant(
      false,
      `
      Your drag handle cannot be a SVGElement for accessibility and cross browser support.

      More information: https://github.com/atlassian/react-beautiful-dnd/tree/master/docs/guides/using-svgs.md
    `,
    );
  }

  return el;
};

export default getDragHandleRef;
