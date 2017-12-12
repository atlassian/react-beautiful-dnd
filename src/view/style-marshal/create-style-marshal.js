// @flow
import { css } from '../animation';

export const draggableClassName = 'react-beautiful-dnd-draggable';

const baseStyles: string = `
  .${draggableClassName} {
    -webkit-touch-callout: none;
    -webkit-tap-highlight-color: rgba(0, 0, 0, 0);
    touch-action: manipulation;
  }
`;

const whileDraggingStyles: string = `
  * {
    cursor: grabbing;
    cursor: -webkit-grabbing;
  }

  ${baseStyles}

  .${draggableClassName} {
    pointer-events: none;
    transition: ${css.outOfTheWay};
  }
`;

export default () => {
  const set = (() => {
    let el: ?HTMLStyleElement;

    return (rules: string) => {
      // create the style tag in the head if we have not already
      if (!el) {
        el = document.createElement('style');
        el.type = 'text/css';
        const head: ?HTMLElement = document.querySelector('head');

        if (!head) {
          throw new Error('cannot append style to head');
        }

        head.appendChild(el);
      }

      // setting the text content for good browser support
      // https://stackoverflow.com/a/22050778/1374236
      el.textContent = rules;
    };
  })();

  const dragStarted = () => {
    set(whileDraggingStyles);
  };

  const dragStopped = () => {
    set(baseStyles);
  };

  // self initialising
  set(baseStyles);

  return { dragStarted, dragStopped };
};
