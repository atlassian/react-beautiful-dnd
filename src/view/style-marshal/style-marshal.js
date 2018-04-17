// @flow
import memoizeOne from 'memoize-one';
import invariant from '../../invariant';
import getStyles, { type Styles } from './get-styles';
import type { StyleMarshal } from './style-marshal-types';
import type {
  State as AppState,
  Phase,
  DropReason,
} from '../../types';

let count: number = 0;

type State = {|
  el: ?HTMLStyleElement,
|}

const prefix: string = 'data-react-beautiful-dnd';

// Required for server side rendering as count is persisted across requests
export const resetStyleContext = () => {
  count = 0;
};

export default () => {
  const context: string = `${count++}`;
  const styles: Styles = getStyles(context);

  let state: State = {
    el: null,
  };

  const setState = (newState: State) => {
    state = newState;
  };

  // using memoizeOne as a way of not updating the innerHTML
  // unless there is a new value required
  const setStyle = memoizeOne((proposed: string) => {
    if (!state.el) {
      console.error('cannot set style of style tag if not mounted');
      return;
    }

    // This technique works with ie11+ so no need for a nasty fallback as seen here:
    // https://stackoverflow.com/a/22050778/1374236
    state.el.innerHTML = proposed;
  });

  // exposing this as a seperate step so that it works nicely with
  // server side rendering
  const mount = () => {
    if (state.el) {
      console.error('Style marshal already mounted');
      return;
    }

    const el: HTMLStyleElement = document.createElement('style');
    el.type = 'text/css';
    // for easy identification
    el.setAttribute(prefix, context);
    const head: ?HTMLElement = document.querySelector('head');

    invariant(head, 'Cannot find the head to append a style to');

    // add style tag to head
    head.appendChild(el);
    setState({
      el,
    });

    // set initial style
    setStyle(styles.resting);
  };

  const onPhaseChange = (current: AppState) => {
    // delaying mount until first update to play nicely with server side rendering
    if (!state.el) {
      console.error('cannot update styles until style marshal is mounted');
      return;
    }

    const phase: Phase = current.phase;

    if (phase === 'DRAGGING') {
      setStyle(styles.dragging);
      return;
    }

    if (phase === 'DROP_ANIMATING') {
      if (!current.drop || !current.drop.pending) {
        console.error('Invalid state found in style-marshal');
        return;
      }

      const reason: DropReason = current.drop.pending.result.reason;

      if (reason === 'DROP') {
        setStyle(styles.dropAnimating);
        return;
      }
      setStyle(styles.userCancel);
      return;
    }

    setStyle(styles.resting);
  };

  const unmount = (): void => {
    if (!state.el) {
      console.error('Cannot unmount style marshal as it is already unmounted');
      return;
    }
    const previous = state.el;

    setState({
      el: null,
    });

    // this should never happen - just appeasing flow
    if (!previous.parentNode) {
      console.error('Cannot unmount style marshal as cannot find parent');
      return;
    }

    previous.parentNode.removeChild(previous);
  };

  const marshal: StyleMarshal = {
    onPhaseChange,
    styleContext: context,
    mount,
    unmount,
  };

  return marshal;
};
