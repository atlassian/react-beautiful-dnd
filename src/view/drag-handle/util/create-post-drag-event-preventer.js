// @flow
/* eslint-disable no-use-before-define */
import type { EventBinding } from './event-types';
import { bindEvents, unbindEvents } from './bind-events';

type GetWindowFn = () => HTMLElement

export type EventPreventer = {|
  preventNext: () => void,
|}

export default (getWindow: GetWindowFn): EventPreventer => {
  let isBound: boolean = false;

  const bind = () => {
    if (isBound) {
      return;
    }
    isBound = true;
    bindEvents(getWindow(), pointerEvents, { capture: true });
  };

  const unbind = () => {
    if (!isBound) {
      return;
    }
    isBound = false;
    unbindEvents(getWindow(), pointerEvents, { capture: true });
  };

  const pointerEvents: EventBinding[] = [
    {
      eventName: 'click',
      fn: (event: MouseEvent) => {
        event.preventDefault();
        unbind();
      },
    },
    {
      eventName: 'mousedown',
      // a new mouse interaction is starting: we can unbind
      fn: unbind,
    },
    {
      eventName: 'touchend',
      fn: (event: TouchEvent) => {
        event.preventDefault();
      },
    },
    {
      eventName: 'touchstart',
      fn: unbind,
    },
  ];

  const preventNext = (): void => {
    if (isBound) {
      unbind();
    }

    bind();
  };

  const preventer: EventPreventer = {
    preventNext,
  };

  return preventer;
};
