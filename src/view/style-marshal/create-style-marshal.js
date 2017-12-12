// @flow
import { css } from '../animation';

export const draggableClassName = 'react-beautiful-dnd-draggable';

const baseStyles: string = `
  .${draggableClassName} {
    -webkit-touch-callout: none;
    -webkit-tap-highlight-color: none;
    touch-action: manipulation;
  }
`;

const whileDraggingStyles: string = `
  * {
    cursor: grab;
  }

  ${baseStyles}

  .${draggableClassName} {
    pointer-events: none;
    transition: ${css.outOfTheWay};
  }
`;

export default () => {
  const getStyleElement = (() => {
    let el: ?HTMLStyleElement;

    // lazily create style tag as required
    return (): HTMLStyleElement => {
      if (el) {
        return el;
      }

      el = document.createElement('style');
      el.type = 'text/css';
      const head: ?HTMLElement = document.querySelector('head');

      if (!head) {
        throw new Error('cannot append style to head');
      }

      head.appendChild(el);
      return el;
    };
  })();

  const apply = () => {
    getStyleElement().innerHTML = whileDraggingStyles;
  };

  const unapply = () => {
    getStyleElement().innerHTML = baseStyles;
  };

  return { apply, unapply };
};
