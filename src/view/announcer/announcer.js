// @flow
import type { Announce } from '../../types';
import type { Announcer } from './announcer-types';

type State = {|
  el: ?HTMLElement,
|}

let count: number = 0;

export default (): Announcer => {
  const id: string = `data-react-beautiful-dnd-announcement-${count++}`;

  let state: State = {
    el: null,
  };

  const setState = (newState: State) => {
    state = newState;
  };

  const announce: Announce = (message: string): void => {
    if (!state.el) {
      console.error('Cannot announce to unmounted node');
      return;
    }

    state.el.textContent = message;
    console.log(`%c ${message}`, 'color: green; font-size: 20px;');
    console.log(state.el);
  };

  const mount = () => {
    if (state.el) {
      console.error('Announcer already mounted');
      return;
    }

    const el: HTMLElement = document.createElement('div');
    // identifier
    el.id = id;

    // Aria live region

    // will force itself to be read
    el.setAttribute('aria-live', 'assertive');
    el.setAttribute('role', 'log');
    // must read the whole thing every time
    el.setAttribute('aria-atomic', 'true');

    // style
    el.style.position = 'absolute';
    el.style.top = '0px';
    el.style.fontSize = '30px';
    el.style.backgroundColor = 'rgba(255,255,255,0.4)';

    // aria

    if (!document.body) {
      throw new Error('Cannot find the head to append a style to');
    }

    // add el tag to body
    document.body.appendChild(el);
    setState({
      el,
    });
  };

  const unmount = () => {
    if (!state.el) {
      console.error('Will not unmount annoucer as it is already unmounted');
      return;
    }
    const previous = state.el;

    setState({
      el: null,
    });

    if (!previous.parentNode) {
      console.error('Cannot unmount style marshal as cannot find parent');
      return;
    }

    previous.parentNode.removeChild(previous);
  };

  const announcer: Announcer = {
    announce,
    describedBy: id,
    mount,
    unmount,
  };

  return announcer;
};

