// @flow
import memoizeOne from 'memoize-one';
import type { EventBinding } from './event-types';

type Pair = {
 hidden: string,
 name: string
};

const defaultPair :Pair = {
  hidden: 'hidden',
  name: 'visibilitychange',
};

const getVisibiltyEvent = memoizeOne(() : Pair => {
  // non prefixed event is supported
  if ('hidden' in document) {
    return defaultPair;
  }

  const prefix: ?string = ['ms', 'webkit', 'moz', 'o']
    .find((prefixItem: string): boolean => `${prefixItem}Hidden` in document);

  // if no prefixed event is supported - simply return the defaultPair.
  // It will not cause any errors to bind to this event - it just won't do anything on
  // visibility change
  if (!prefix) {
    return defaultPair;
  }

  return {
    hidden: `${prefix}Hidden`,
    name: `${prefix}visibilitychange`,
  };
});

export default (cancel: Function = () => {}) : EventBinding => {
  if (typeof window !== 'undefined') {
    const visEvent = getVisibiltyEvent();
    return {
      eventName: visEvent.name,
      fn: () => {
        if (document[visEvent.hidden]) {
          cancel();
        }
      },
    };
  }
  return {
    eventName: '',
    fn: () => {},
  };
};
