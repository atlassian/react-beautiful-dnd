// @flow
import memoizeOne from 'memoize-one';
import type { EventBinding } from './event-types';

type Properties = {|
  isHidden: string,
  visibilityEventName: string
|};

const defaultProperties: Properties = {
  isHidden: 'hidden',
  visibilityEventName: 'visibilitychange',
};

const getSupportedProperties = memoizeOne((): Properties => {
  // non prefixed event is supported
  if (defaultProperties.isHidden in document) {
    return defaultProperties;
  }

  const prefix: ?string = ['ms', 'webkit', 'moz', 'o']
    .find((prefixItem: string): boolean => `${prefixItem}Hidden` in document);

  // if no prefixed event is supported - simply return the default.
  // It will not cause any errors to bind to this event - it just won't do anything on
  // visibility change
  if (!prefix) {
    return defaultProperties;
  }

  return {
    isHidden: `${prefix}Hidden`,
    visibilityEventName: `${prefix}visibilitychange`,
  };
});

export default (cancel: Function): EventBinding => {
  // Server side rendering
  if (typeof document === 'undefined') {
    return {
      eventName: defaultProperties.visibilityEventName,
      fn: () => { },
    };
  }

  const properties: Properties = getSupportedProperties();

  const cancelIfHidden = () => {
    // $FlowFixMe - dynamic property lookup on document
    const isHidden: boolean = Boolean(document[properties.isHidden]);

    if (isHidden) {
      cancel();
    }
  };

  return {
    eventName: properties.visibilityEventName,
    fn: cancelIfHidden,
  };
};
