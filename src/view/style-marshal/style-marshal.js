// @flow
import { css } from '../animation';
import type { Marshal } from './style-marshal-types';
import type {
  State as AppState,
} from '../../types';

let count: number = 0;
const key: string = 'react-beautiful-dnd';

const getIsAnimatingCancel = (state: AppState) => {
  if (state.phase !== 'DROP_ANIMATING') {
    return false;
  }

  if (!state.drop || !state.drop.pending) {
    return false;
  }

  return state.drop.pending.trigger === 'CANCEL';
};

type State = {|
  isDraggingStyleActive: boolean,
|}

export default () => {
  const context: string = `${count++}`;
  const draggableClassName: string = `${key}-draggable-${context}`;
  const tagName: string = `data-${key}-${context}`;

  const baseStyles: string = `
  .${draggableClassName} {
    -webkit-touch-callout: none;
    -webkit-tap-highlight-color: rgba(0,0,0,0);
    touch-action: manipulation;
  }
`;

  const whileDraggingStyles: string = `
    body {
      cursor: grabbing;
      cursor: -webkit-grabbing;
      user-select: none;
    }

    ${baseStyles}

    .${draggableClassName} {
      pointer-events: none;
      transition: ${css.outOfTheWay};
    }
  `;

  let state: State = {
    isDraggingStyleActive: false,
  };

  const setState = (newState: State) => {
    state = newState;
  };

  const setStyle = (() => {
    let el: ?HTMLStyleElement;

    return (rules: string) => {
      // create the style tag in the head if we have not already
      if (!el) {
        el = document.createElement('style');
        el.type = 'text/css';
        // for easy identification
        el.setAttribute(tagName, '');
        const head: ?HTMLElement = document.querySelector('head');

        if (!head) {
          throw new Error('Cannot find the head to append a style to');
        }

        head.appendChild(el);
      }

      // This technique works with ie11+ so no need for a nasty fallback as seen here:
      // https://stackoverflow.com/a/22050778/1374236
      el.innerHTML = rules;
    };
  })();

  const applyDragStyles = () => {
    if (state.isDraggingStyleActive) {
      console.warn('not applying dragging styles as they are already active');
      return;
    }
    console.warn('applying drag styles');
    setState({
      isDraggingStyleActive: true,
    });
    setStyle(whileDraggingStyles);
  };

  const applyBaseStyles = () => {
    if (!state.isDraggingStyleActive) {
      console.warn('removing dragging styles even though there was no active drag');
      // not returning - need to provide a way of clearing even in an error scenario
    }

    console.warn('applying base styles');

    setState({
      isDraggingStyleActive: false,
    });
    setStyle(baseStyles);
  };

  // self initiating
  setStyle(baseStyles);

  const onStateChange = (current: AppState, previous: AppState) => {
    const wasAnimatingCancel: boolean = getIsAnimatingCancel(previous);
    const isAnimatingCancel: boolean = getIsAnimatingCancel(current);
    const wasDragging: boolean = previous.phase === 'DRAGGING';
    const isDragging: boolean = current.phase === 'DRAGGING';
    const isDragStarting: boolean = !wasDragging && isDragging;
    const isDragStopping: boolean = wasDragging && !isDragging;

    if (isDragStarting) {
      applyDragStyles();
      return;
    }

    // not removing styles when animating a cancel as we want to prevent
    // the user from dragging anything until the animation for this type
    // of drop is complete.
    if (isAnimatingCancel) {
      return;
    }

    // Reset to the base styles if drag is stopping, or we where previously
    // holding off applying the base styles because of a cancel
    if (isDragStopping || wasAnimatingCancel) {
      applyBaseStyles();
    }
  };

  const marshal: Marshal = {
    onStateChange,
    draggableClassName,
    tagName,
  };

  return marshal;
};
