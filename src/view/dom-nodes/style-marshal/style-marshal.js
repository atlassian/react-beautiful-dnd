// @flow
import memoizeOne from 'memoize-one';
import invariant from 'tiny-invariant';
import type { DropReason } from '../../../types';
import getStyles, { type Styles } from './get-styles';
import { prefix } from '../../data-attributes';
import createStyleElement from '../create-style-element';
import getHead from '../get-head';

export type StyleMarshal = {|
  dragging: () => void,
  dropping: (reason: DropReason) => void,
  resting: () => void,
  unmount: () => void,
  mount: () => void,
|};

export default (styleContext: string): StyleMarshal => {
  // using memoizeOne as a way of not updating the innerHTML
  // unless there is a new value required
  const setStyle = memoizeOne((el: ?HTMLStyleElement, proposed: string) => {
    invariant(el, 'Cannot set style of style tag if not mounted');
    // This technique works with ie11+ so no need for a nasty fallback as seen here:
    // https://stackoverflow.com/a/22050778/1374236
    el.innerHTML = proposed;
  });

  const styles: Styles = getStyles(styleContext);
  let always: ?HTMLStyleElement = null;
  let dynamic: ?HTMLStyleElement = null;

  const mount = () => {
    invariant(!always && !dynamic);
    always = createStyleElement();
    dynamic = createStyleElement();
    always.setAttribute(`${prefix}-always`, styleContext);
    dynamic.setAttribute(`${prefix}-dynamic`, styleContext);

    // add style tags to head
    getHead().appendChild(always);
    getHead().appendChild(dynamic);

    // set initial style
    setStyle(always, styles.always);
    setStyle(dynamic, styles.resting);
  };

  const dragging = () => setStyle(dynamic, styles.dragging);
  const dropping = (reason: DropReason) => {
    if (reason === 'DROP') {
      setStyle(dynamic, styles.dropAnimating);
      return;
    }
    setStyle(dynamic, styles.userCancel);
  };
  const resting = () => setStyle(dynamic, styles.resting);

  const unmount = (): void => {
    invariant(
      always && dynamic,
      'Cannot unmount style marshal as it is already unmounted',
    );

    // Remove from head
    getHead().removeChild(always);
    getHead().removeChild(dynamic);
    // Unset for cleanup
    always = null;
    dynamic = null;
  };

  const marshal: StyleMarshal = {
    dragging,
    dropping,
    resting,
    mount,
    unmount,
  };

  return marshal;
};
