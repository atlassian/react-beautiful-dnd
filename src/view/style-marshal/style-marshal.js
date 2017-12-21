// @flow
import memoizeOne from 'memoize-one';
import getStyles, { type Styles } from './get-styles';
import type { StyleMarshal } from './style-marshal-types';
import type {
  State as AppState,
  Phase,
  DropTrigger,
} from '../../types';

let count: number = 0;

type State = {
  isMounted: boolean,
}

const prefix: string = 'data-react-beautiful-dnd';

export default () => {
  const context: string = `${count++}`;
  const styles: Styles = getStyles(context);

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

  let state: State = {
    isMounted: true,
  };

  const setState = (partial: Object) => {
    const newState: State = {
      ...state,
      ...partial,
    };
    state = newState;
  };

  // using memoizeOne as a way of not updating the innerHTML
  // unless there is a new value required
  const setStyle = memoizeOne((proposed: string) => {
    // This technique works with ie11+ so no need for a nasty fallback as seen here:
    // https://stackoverflow.com/a/22050778/1374236
    el.innerHTML = proposed;
  });

  // self initiating
  setStyle(styles.resting);

  const onPhaseChange = (current: AppState) => {
    if (!state.isMounted) {
      console.error('cannot update styles when not mounted');
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

      const trigger: DropTrigger = current.drop.pending.trigger;

      if (trigger === 'DROP') {
        setStyle(styles.dropping);
        return;
      }
      console.warn('user cancel styles');
      setStyle(styles.userCancel);
      return;
    }

    setStyle(styles.resting);
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
