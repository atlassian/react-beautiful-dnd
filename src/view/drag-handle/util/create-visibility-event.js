// @flow
import type { EventBinding } from './event-types';

const getHiddenPrefix = () : ?string => {
  const prefixes = ['ms', 'webkit', 'moz', 'o'];
  let browserPrefix;
  prefixes.forEach((prefix) => {
    if (`${prefix}Hidden` in document) {
      browserPrefix = `${prefix}Hidden`;
    }
  });
  if (!browserPrefix && 'hidden' in document) { // Opera 12.10 and Firefox 18 and later support
    return 'hidden';
  }
  return browserPrefix;
};

export default (cancel: Function = () => {}) : EventBinding => {
  if (typeof window !== 'undefined') {
    const hidden = getHiddenPrefix();
    return {
      eventName: 'visibilitychange',
      fn: () => {
        if (document[hidden]) {
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
