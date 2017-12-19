// @flow
import { css } from '../animation';
import type { StyleMarshal } from './style-marshal-types';
import canStartDrag from '../../state/can-start-drag';
import type {
  State as AppState,
  Phase,
} from '../../types';

let count: number = 0;

type Applied = 'DRAG' | 'BASE';

type State = {
  applied: ?Applied,
  isMounted: boolean,
}

const prefix: string = 'data-react-beautiful-dnd';
export default () => {
  const context: string = `${count++}`;
  const dragHandleSelector: string = `[${prefix}-drag-handle="${context}"]`;
  const draggableSelector: string = `[${prefix}-draggable="${context}"]`;
  const el: HTMLElement = (() => {
    const result = document.createElement('style');
    result.type = 'text/css';
    // for easy identification
    result.setAttribute(prefix, context);
    const head: ?HTMLElement = document.querySelector('head');

    if (!head) {
      throw new Error('Cannot find the head to append a style to');
    }

    head.appendChild(result);
    return result;
  })();

  // ## Base styles

  // ### Drag handle

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

  const baseStyles: string = `
    ${dragHandleSelector} {
      -webkit-touch-callout: none;
      -webkit-tap-highlight-color: rgba(0,0,0,0);
      touch-action: manipulation;
      cursor: -webkit-grab;
      cursor: grab;
    }
  `;

  // ## While dragging styles

  // ### Body

  // cursor: grab
  // We apply this by default for an improved user experience. It is such a common default that we
  // bake it right in. Consumers can opt out of this by adding a selector with higher specificity

  // user-select: none
  // This prevents the user from selecting text on the page while dragging

  // ## Drag handle

  // > We apply all of the base styles while dragging

  // pointer-events: none
  // This style has two purposes
  // 1. It prevents other

  const whileDraggingStyles: string = `
    body {
      cursor: grabbing;
      cursor: -webkit-grabbing;
      -webkit-user-select: none;
      -moz-user-select: none;
      -ms-user-select: none;
      user-select: none;
    }

    ${baseStyles}

    ${dragHandleSelector} {
      pointer-events: none;
    }

    ${draggableSelector} {
      transition: ${css.outOfTheWay};
    }
  `;

  let state: State = {
    applied: null,
    isMounted: true,
  };

  const setState = (partial: Object) => {
    const newState: State = {
      ...state,
      ...partial,
    };
    state = newState;
  };

  const setStyle = (apply: Applied) => {
    if (state.applied === apply) {
      return;
    }
    console.warn('setting style:', apply);
    setState({
      applied: apply,
    });

    // This technique works with ie11+ so no need for a nasty fallback as seen here:
    // https://stackoverflow.com/a/22050778/1374236
    el.innerHTML = apply === 'DRAG' ? whileDraggingStyles : baseStyles;
  };

  // self initiating
  setStyle('BASE');

  const onPhaseChange = (current: AppState) => {
    // TODO: better styles for pre drag phases?

    if (!state.isMounted) {
      console.error('cannot update styles when not mounted');
      return;
    }

    const phase: Phase = current.phase;

    if (phase === 'DRAGGING') {
      setStyle('DRAG');
      return;
    }

    // if (phase === 'DROP_ANIMATING') {
    //   // if (current.drop.pending.trigger === 'CANCEL') {
    //     // using dragging styles
    //   setStyle('BASE');
    //   return;
    //   // }
    // }

    setStyle('BASE');
  };

  const unmount = (): void => {
    if (!state.isMounted) {
      console.error('Cannot unmount style marshal as it is already unmounted');
      return;
    }
    setState({
      isMounted: false,
    });

    // this should never happen - just appeasing flow
    if (!el.parentNode) {
      console.error('Cannot unmount style marshal as cannot find parent');
      return;
    }

    el.parentNode.removeChild(el);
  };

  const marshal: StyleMarshal = {
    onPhaseChange,
    styleContext: context,
    unmount,
  };

  return marshal;
};
