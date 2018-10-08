// @flow
import { transitions } from '../animation';
import * as attributes from '../data-attributes';

export type Styles = {|
  always: string,
  dragging: string,
  resting: string,
  dropAnimating: string,
  userCancel: string,
|};

type Rule = {|
  selector: string,
  styles: {|
    always?: string,
    resting?: string,
    dragging?: string,
    dropAnimating?: string,
    userCancel?: string,
  |},
|};

const makeGetSelector = (context: string) => (attribute: string) =>
  `[${attribute}="${context}"]`;

const getStyles = (rules: Rule[], property: string): string =>
  rules
    .map(
      (rule: Rule): string => {
        const value: ?string = rule.styles[property];
        if (!value) {
          return '';
        }

        return `${rule.selector} { ${value} }`;
      },
    )
    .join(' ');

const noPointerEvents: string = 'pointer-events: none;';

export default (styleContext: string): Styles => {
  const getSelector = makeGetSelector(styleContext);

  // ## Drag handle styles

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

  // cursor: grab
  // We apply this by default for an improved user experience. It is such a common default that we
  // bake it right in. Consumers can opt out of this by adding a selector with higher specificity
  // The cursor will not apply when pointer-events is set to none

  // pointer-events: none
  // this is used to prevent pointer events firing on draggables during a drag
  // Reasons:
  // 1. performance: it stops the other draggables from processing mouse events
  // 2. scrolling: it allows the user to scroll through the current draggable
  // to scroll the list behind
  // 3.* function: it blocks other draggables from starting. This is not relied on though as there
  // is a function on the context (canLift) which is a more robust way of controlling this

  const dragHandle: Rule = (() => {
    const grabCursor = `
      cursor: -webkit-grab;
      cursor: grab;
    `;
    return {
      selector: getSelector(attributes.dragHandle),
      styles: {
        always: `
          -webkit-touch-callout: none;
          -webkit-tap-highlight-color: rgba(0,0,0,0);
          touch-action: manipulation;
        `,
        resting: grabCursor,
        dragging: noPointerEvents,
        // it is fine for users to start dragging another item when a drop animation is occurring
        dropAnimating: grabCursor,
        // Not applying grab cursor during a user cancel as it is not possible for users to reorder
        // items during a cancel
      },
    };
  })();

  // ## Draggable styles

  // transition: transform
  // This controls the animation of draggables that are moving out of the way
  // The main draggable is controlled by react-motion.

  const draggable: Rule = (() => {
    const transition: string = `
      transition: ${transitions.outOfTheWay};
    `;
    return {
      selector: getSelector(attributes.draggable),
      styles: {
        dragging: transition,
        dropAnimating: transition,
        userCancel: transition,
      },
    };
  })();

  // ## Droppable styles

  // overflow-anchor: none;
  // Opting out of the browser feature which tries to maintain
  // the scroll position when the DOM changes above the fold.
  // This does not work well with reordering DOM nodes.
  // When we drop a Draggable it already has the correct scroll applied.

  // pointer-events: none;
  // It is very common for users to have accidental mouse handlers and
  // hover styles on elements around a draggable which can cause
  // performance and visual issues. So just turning it off here

  const droppable: Rule = {
    selector: getSelector(attributes.droppable),
    styles: {
      always: `overflow-anchor: none;`,
      dragging: noPointerEvents,
    },
  };

  // ## Body styles

  // cursor: grab
  // We apply this by default for an improved user experience. It is such a common default that we
  // bake it right in. Consumers can opt out of this by adding a selector with higher specificity

  // user-select: none
  // This prevents the user from selecting text on the page while dragging

  // overflow-anchor: none
  // We are in control and aware of all of the window scrolls that occur
  // we do not want the browser to have behaviors we do not expect

  const body: Rule = {
    selector: 'body',
    styles: {
      dragging: `
        cursor: grabbing;
        cursor: -webkit-grabbing;
        user-select: none;
        -webkit-user-select: none;
        -moz-user-select: none;
        -ms-user-select: none;
        overflow-anchor: none;
      `,
    },
  };

  const rules: Rule[] = [draggable, dragHandle, droppable, body];

  return {
    always: getStyles(rules, 'always'),
    resting: getStyles(rules, 'resting'),
    dragging: getStyles(rules, 'dragging'),
    dropAnimating: getStyles(rules, 'dropAnimating'),
    userCancel: getStyles(rules, 'userCancel'),
  };
};
