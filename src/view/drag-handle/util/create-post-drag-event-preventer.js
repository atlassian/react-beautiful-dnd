// @flow
/* eslint-disable no-use-before-define */
import type { EventBinding } from './event-types';
import { bindEvents, unbindEvents } from './bind-events';

type GetWindowFn = () => HTMLElement;

export type EventPreventer = {|
  preventNext: () => void,
  abort: () => void,
|};

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
    // These events signal that the click prevention is no longer needed
    {
      eventName: 'mousedown',
      // a new mouse interaction is starting: we can unbind
      fn: unbind,
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
    abort: unbind,
  };

  return preventer;
};
