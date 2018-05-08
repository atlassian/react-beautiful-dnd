// @flow
import memoizeOne from 'memoize-one';
import invariant from 'tiny-invariant';
import getStyles, { type Styles } from './get-styles';
import { prefix } from '../data-attributes';
import type { StyleMarshal } from './style-marshal-types';
import type {
  State as AppState,
  DropReason,
} from '../../types';

let count: number = 0;

// Required for server side rendering as count is persisted across requests
export const resetStyleContext = () => {
  count = 0;
};

export default () => {
  const context: string = `${count++}`;
  const styles: Styles = getStyles(context);
  let el: ?HTMLStyleElement = null;

  // using memoizeOne as a way of not updating the innerHTML
  // unless there is a new value required
  const setStyle = memoizeOne((proposed: string) => {
    invariant(el, 'Cannot set style of style tag if not mounted');
    // This technique works with ie11+ so no need for a nasty fallback as seen here:
    // https://stackoverflow.com/a/22050778/1374236
    el.innerHTML = proposed;
  });

  // exposing this as a seperate step so that it works nicely with
  // server side rendering
  const mount = () => {
    invariant(!el, 'Style marshal already mounted');

    el = document.createElement('style');
    el.type = 'text/css';
    // for easy identification
    el.setAttribute(prefix, context);

    // add style tag to head
    const head: ?HTMLElement = document.querySelector('head');
    invariant(head, 'Cannot find the head to append a style to');
    head.appendChild(el);

    // set initial style
    setStyle(styles.resting);
  };

  const onPhaseChange = (current: AppState) => {
    // delaying mount until first update to play nicely with server side rendering
    invariant(el, 'cannot update styles until style marshal is mounted');

    if (current.phase === 'DRAGGING' ||
      current.phase === 'DROP_ANIMATING' ||
      current.phase === 'BULK_COLLECTING') {
      setStyle(styles.dragging);
      return;
    }

    if (current.phase === 'DROP_ANIMATING') {
      const reason: DropReason = current.pending.result.reason;

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
    invariant(el, 'Cannot unmount style marshal as it is already unmounted');
    invariant(el.parentNode, 'Cannot unmount style marshal as cannot find parent');

    el.parentNode.removeChild(el);
  };

  const marshal: StyleMarshal = {
    onPhaseChange,
    styleContext: context,
    mount,
    unmount,
  };

  return marshal;
};
