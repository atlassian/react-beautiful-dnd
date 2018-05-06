// @flow
import invariant from 'tiny-invariant';
import type { Announce } from '../../types';
import type { Announcer } from './announcer-types';

let count: number = 0;

// https://allyjs.io/tutorials/hiding-elements.html
// Element is visually hidden but is readable by screen readers
const visuallyHidden: Object = {
  position: 'absolute',
  width: '1px',
  height: '1px',
  margin: '-1px',
  border: '0',
  padding: '0',
  overflow: 'hidden',
  clip: 'rect(0 0 0 0)',
  // for if 'clip' is ever removed
  'clip-path': 'inset(100%)',
};

export default (): Announcer => {
  const id: string = `react-beautiful-dnd-announcement-${count++}`;
  let el: ?HTMLElement = null;

  const announce: Announce = (message: string): void => {
    invariant(el, 'Cannot announce to unmounted node');
    el.textContent = message;
  };

  const mount = () => {
    invariant(!el, 'Announcer already mounted');

    el = document.createElement('div');
    // identifier
    el.id = id;

    // Aria live region

    // will force itself to be read
    el.setAttribute('aria-live', 'assertive');
    el.setAttribute('role', 'log');
    // must read the whole thing every time
    el.setAttribute('aria-atomic', 'true');

    // hide the element visually
    Object.assign(el.style, visuallyHidden);

    invariant(document.body, 'Cannot find the head to append a style to');

    // add el tag to body
    document.body.appendChild(el);
  };

  const unmount = () => {
    invariant(el, 'Will not unmount annoucer as it is already unmounted');
    invariant(el.parentNode, 'Cannot unmount style marshal as cannot find parent');

    el.parentNode.removeChild(el);
  };

  const announcer: Announcer = {
    announce,
    id,
    mount,
    unmount,
  };

  return announcer;
};

