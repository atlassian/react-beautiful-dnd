// @flow
import type { EventBinding } from './event-types';

const getVisibiltyEvent = () : ?{hidden:string, name:string} => {
  const prefixes = ['ms', 'webkit', 'moz', 'o'];
  let browserPrefix;
  prefixes.forEach((prefix) => {
    if (`${prefix}Hidden` in document) {
      browserPrefix = {
        hidden: `${prefix}Hidden`,
        name: `${prefix}visibilitychange`,
      };
    }
  });
  if (!browserPrefix && 'hidden' in document) { // Opera 12.10 and Firefox 18 and later support
    return {
      hidden: 'hidden',
      name: 'visibilitychange',
    };
  }
  return browserPrefix;
};

export default (cancel: Function = () => {}) : EventBinding => {
  if (typeof window !== 'undefined') {
    const visEvent = getVisibiltyEvent();
    if (visEvent) {
      return {
        eventName: visEvent.name,
        fn: () => {
          if (document[visEvent.hidden]) {
            cancel();
          }
        },
      };
    }
  }
  return {
    eventName: '',
    fn: () => {},
  };
};
