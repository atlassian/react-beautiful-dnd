// @flow
import { css } from '../animation';

export type Styles = {|
  dragging: string,
  resting: string,
  dropAnimating: string,
  userCancel: string,
|}

const prefix: string = 'data-react-beautiful-dnd';

export default (styleContext: string): Styles => {
  const dragHandleSelector: string = `[${prefix}-drag-handle="${styleContext}"]`;
  const draggableSelector: string = `[${prefix}-draggable="${styleContext}"]`;
  const droppableSelector: string = `[${prefix}-droppable="${styleContext}"]`;

  // ## Drag handle styles

  // ### Base styles
  // > These are applied at all times

  // -webkit-touch-callout
  // A long press on anchors usually pops a content menu that has options for
  // the link such as 'Open in new tab'. Because long press is used to start
  // a drag we need to opt out of this behavior

  // -webkit-tap-highlight-color
  // Webkit based browsers add a grey overlay to anchors when they are active.
  // We remove this tap overlay as it is confusing for users
  // https://css-tricks.com/snippets/css/remove-gray-highlight-when-tapping-links-in-mobile-safari/

  // touch-action: manipulation
  // Avoid the *pull to refresh action* and *delayed anchor focus* on Android Chrome

  // ### Grab cursor

  // cursor: grab
  // We apply this by default for an improved user experience. It is such a common default that we
  // bake it right in. Consumers can opt out of this by adding a selector with higher specificity
  // The cursor will not apply when pointer-events is set to none

  // ## While active dragging
  // > these are applied while a drag is occurring

  // pointer-events: none
  // this is used to prevent pointer events firing on draggables during a drag.
  // This is a performance optimisation

  // cursor: grabbing
  // we want to override the cursor for the element while dragging

  const dragHandleStyles = {
    base: `
      ${dragHandleSelector} {
        -webkit-touch-callout: none;
        -webkit-tap-highlight-color: rgba(0,0,0,0);
        touch-action: manipulation;
      }
    `,
    grabCursor: `
      ${dragHandleSelector} {
        cursor: -webkit-grab;
        cursor: grab;
      }
    `,
    whileActiveDragging: `
      ${dragHandleSelector} {
        pointer-events: none;
        cursor: grabbing;
        cursor: -webkit-grabbing;
      }
    `,
  };

  // ## Draggable styles

  // ### Animate movement

  // transition: transform
  // This controls the animation of draggables that are moving out of the way
  // The main draggable is controlled by react-motion.

  const draggableStyles = {
    animateMovement: `
      ${draggableSelector} {
        transition: ${css.outOfTheWay};
      }
    `,
  };

  // ## Droppable styles

  // ### Base
  // > Applied at all times

  // overflow-anchor: none;
  // Opting out of the browser feature which tries to maintain
  // the scroll position when the DOM changes above the fold.
  // This does not work well with reordering DOM nodes.
  // When we drop a Draggable it already has the correct scroll applied.

  const droppableStyles = {
    base: `
      ${droppableSelector} {
        overflow-anchor: none;
      }
    `,
  };

  // ## Body styles

  // ### While active dragging
  // > Applied while the user is actively dragging

  // cursor: grab
  // We apply this by default for an improved user experience. It is such a common default that we
  // bake it right in. Consumers can opt out of this by adding a selector with higher specificity
  // We apply it to the body in case the user pointer slips off the drag handle

  // user-select: none
  // This prevents the user from selecting text on the page while dragging

  const bodyStyles = {
    whileActiveDragging: `
      body {
        cursor: grabbing;
        cursor: -webkit-grabbing;
        user-select: none;
        -webkit-user-select: none;
        -moz-user-select: none;
        -ms-user-select: none;
      }
    `,
  };

  const base: string[] = [
    dragHandleStyles.base,
    droppableStyles.base,
  ];

  const resting: string = [
    ...base,
    dragHandleStyles.grabCursor,
  ].join('');

  const dragging: string = [
    ...base,
    dragHandleStyles.whileActiveDragging,
    draggableStyles.animateMovement,
    bodyStyles.whileActiveDragging,
  ].join('');

  const dropAnimating: string = [
    ...base,
    dragHandleStyles.grabCursor,
    draggableStyles.animateMovement,
  ].join('');

  // Not applying grab cursor during a cancel as it is not possible for users to reorder
  // items during a cancel
  const userCancel: string = [
    ...base,
    draggableStyles.animateMovement,
  ].join('');

  return { resting, dragging, dropAnimating, userCancel };
};

